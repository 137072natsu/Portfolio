
#pragma once

#include "DataManager.h"
#include <atomic>
#include <mutex>
#include <thread>
#include <cstdint>

class DataConverter : public DataManager
{
public:
    ~DataConverter() override;

    bool Convert(
        const std::filesystem::path& acf,
        const std::filesystem::path& acb,
        const std::filesystem::path& awb,
        const std::filesystem::path& outputJson);

private:
    struct Features
    {
        double sumSq = 0.0;
        double peak = 0.0;
        uint64_t sampleCount = 0;
    };

    void PcmLoop();
    void Cleanup();

    static constexpr int SampleRate = 48000;
    static constexpr int Channels = 2;
    static constexpr int FramesPerPull = 1024;

    std::thread pcmThread_;
    std::atomic<bool> running_{false};

    std::mutex mutex_;
    bool capturing_ = false;
    Features features_;
};
