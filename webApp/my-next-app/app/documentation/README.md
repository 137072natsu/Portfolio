# 成果報告

## スキルジャンル
- web開発技術
- UnrealEngineによる基礎的なゲーム制作スキル


## 詳細
- videoページに掲載しているのはUnrealEngineを用いて、敵がPlayerを視認したら襲ってくるAIを作成したものである。<br>
敵はAIPerceptionによる視覚を有しており、それらのコードをEnemyAIControllerでまとめている。

- 敵はEnemyBaseCharacterを派生させて作成したものであり、追いかけてくるにあたっての見失い距離やあきらめる時間なども設定している。<br>

- 敵に触れるとPlayerは**爆発**するシステムを搭載している。また、接触イベントに伴ってSoundも発生するように設定。これらの音やエフェクトの付随設定はすべてBluePrintで制作している。