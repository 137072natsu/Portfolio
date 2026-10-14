#include "DataManager.h"

#include <chrono>
#include <iostream>
#include <thread>

int main()
{
    DataManager dataManager;

    // 初期化
    if (!dataManager.Initialize(
        "SampleProject.acf",
        "AtomCueSheet.acb"))
    {
        std::cerr << "Initialization failed\n";
        return 1;
    }

    // キュー名を指定して再生
    dataManager.PlayCue("GunShot");

    // 再生が完了するまで更新
    while (true)
    {
        dataManager.Update();

        auto status = dataManager.GetStatus();

        if (status == CRIATOMEXPLAYER_STATUS_PLAYEND ||
            status == CRIATOMEXPLAYER_STATUS_ERROR ||
            status == CRIATOMEXPLAYER_STATUS_STOP)
        {
            break;
        }

        std::this_thread::sleep_for(
            std::chrono::milliseconds(16));
    }

    // 終了処理はデストラクタから呼ばれる
    return 0;
}
