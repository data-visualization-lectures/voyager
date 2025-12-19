
## 前提条件

- **Node.js**: v16.16.0
- **パッケージマネージャー**: Yarn (推奨) または npm

## Node.js バージョンの設定

このプロジェクトは Node.js v16.16.0 での動作を想定しています。
[`nvm`](https://github.com/nvm-sh/nvm) (Node Version Manager) を使用している場合は、以下のコマンドで自動的に推奨バージョンに切り替えることができます。

```bash
# .nvmrc に記載されたバージョン (v16.16.0) を使用
nvm use

# Node.js v16 環境下で yarn を利用可能にするため、グローバルインストールを実行
# (これをしないと、別のバージョンの yarn/corepack が反応してエラーになる場合があります)
npm install -g yarn

# まだインストールされていない場合は以下を実行
nvm install
```

## セットアップ
yarn install

## ビルド
yarn build

## 開発サーバーを起動する
yarn start

## ビルドした成果物 (dist) を確認する
npx serve -s dist

