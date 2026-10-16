#include "PcmRecorder.h"

#include <algorithm>
#include <cmath>
#include <filesystem>
#include <fstream>
#include <limits>

namespace {
void WriteU16(std::ostream& out, std::uint16_t v) {
    for (int i = 0; i < 2; ++i) out.put(static_cast<char>((v >> (8*i)) & 255));
}
void WriteU32(std::ostream& out, std::uint32_t v) {
    for (int i = 0; i < 4; ++i) out.put(static_cast<char>((v >> (8*i)) & 255));
}
std::int16_t ConvertFloat(float value) {
    if (!std::isfinite(value)) return 0;
    value = std::clamp(value, -1.0f, 1.0f);
    return static_cast<std::int16_t>(
        std::clamp(std::lround(value * 32767.0f), -32768L, 32767L));
}
}

bool PcmRecorder::Begin(int sampleRate, int channels, int maxSeconds) {
    if (sampleRate <= 0 || sampleRate > 192000 ||
        channels <= 0 || channels > 2 || maxSeconds <= 0 || maxSeconds > 60)
        return false;
    std::lock_guard<std::mutex> guard(mutex_);
    if (capturing_) return false;
    sampleRate_ = sampleRate;
    channels_ = channels;
    frames_ = 0;
    invalidFormat_ = false;
    full_.store(false, std::memory_order_release);
    pcm_.assign(static_cast<std::size_t>(sampleRate) * channels * maxSeconds, 0);
    capturing_ = true;
    return true;
}

void PcmRecorder::FilterCallback(void* obj, CriAtomExPlaybackId,
    CriAtomPcmFormat format, CriSint32 numChannels,
    CriSint32 numSamples, void* data[]) {
    if (obj != nullptr)
        static_cast<PcmRecorder*>(obj)->Append(format, numChannels, numSamples, data);
}

void PcmRecorder::Append(CriAtomPcmFormat format, int numChannels,
    int numSamples, void* data[]) {
    if (numSamples <= 0 || data == nullptr) return;
    // コールバック内でファイルI/O、HTTP、メモリ再確保は行わない。
    // mutexで共有状態を守る。製品版はロックフリーのリングバッファが推奨。
    std::lock_guard<std::mutex> guard(mutex_);
    if (!capturing_) return;
    if (numChannels != channels_ ||
        (format != CRIATOM_PCM_FORMAT_FLOAT32 && format != CRIATOM_PCM_FORMAT_SINT16)) {
        invalidFormat_ = true;
        capturing_ = false;
        full_.store(true, std::memory_order_release);
        return;
    }
    for (int ch = 0; ch < channels_; ++ch) {
        if (data[ch] == nullptr) {
            invalidFormat_ = true;
            capturing_ = false;
full_.store(true, std::memory_order_release);
            return;
        }
    }
    const std::size_t capacityFrames = pcm_.size() / static_cast<std::size_t>(channels_);
    const std::size_t available = capacityFrames - frames_;
    const std::size_t toCopy = std::min<std::size_t>(available, static_cast<std::size_t>(numSamples));
    for (std::size_t s = 0; s < toCopy; ++s) {
        for (int ch = 0; ch < channels_; ++ch) {
            const auto sample = format == CRIATOM_PCM_FORMAT_FLOAT32
                ? ConvertFloat(static_cast<const float*>(data[ch])[s])
                : static_cast<const std::int16_t*>(data[ch])[s];
            pcm_[(frames_ + s) * channels_ + ch] = sample;
        }
    }
    frames_ += toCopy;
    if (frames_ == capacityFrames) {
        capturing_ = false;
        full_.store(true, std::memory_order_release);
    }
}

bool PcmRecorder::FinishToWav(const std::string& filePath) {
    std::lock_guard<std::mutex> guard(mutex_);
    capturing_ = false;
    if (invalidFormat_ || frames_ == 0) return false;
    const std::uint32_t dataBytes = static_cast<std::uint32_t>(
        frames_ * static_cast<std::size_t>(channels_) * sizeof(std::int16_t));
    std::ofstream out(std::filesystem::u8path(filePath), std::ios::binary);
    if (!out) return false;
    out.write("RIFF", 4);
    WriteU32(out, 36 + dataBytes);
    out.write("WAVE", 4);
    out.write("fmt ", 4);
    WriteU32(out, 16);                      // PCM fmt chunk length
    WriteU16(out, 1);                       // integer PCM
    WriteU16(out, static_cast<std::uint16_t>(channels_));
    WriteU32(out, static_cast<std::uint32_t>(sampleRate_));
    WriteU32(out, static_cast<std::uint32_t>(sampleRate_ * channels_ * 2));
    WriteU16(out, static_cast<std::uint16_t>(channels_ * 2));
    WriteU16(out, 16);                      // bits per sample
    out.write("data", 4);
    WriteU32(out, dataBytes);
    out.write(reinterpret_cast<const char*>(pcm_.data()), dataBytes);
    return static_cast<bool>(out);
}

void PcmRecorder::Cancel() {
    std::lock_guard<std::mutex> guard(mutex_);
    capturing_ = false;
}
