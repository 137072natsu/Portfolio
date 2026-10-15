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
