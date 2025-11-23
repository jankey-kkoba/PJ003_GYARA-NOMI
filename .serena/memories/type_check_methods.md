# 型チェック方法

## Next.jsプロジェクトでの型チェック

### 方法1: npm scriptでの型チェック（推奨）
```bash
npm run typecheck
```
- package.jsonに`"typecheck": "tsc --noEmit"`スクリプトを設定済み
- `--noEmit`: JavaScriptファイルを出力せず、型チェックのみ実行
- 最も高速で型エラーのみを確認できる
- **この方法を優先して使用すること**

### 方法2: TypeScriptコンパイラを直接実行
```bash
npx tsc --noEmit
```
- 方法1と同じ処理を直接実行
- npm scriptが使えない場合の代替手段

### 方法3: ビルド時の型チェック
```bash
cd frontend && npm run build
```
- Next.jsのビルドプロセスで型チェックも実行される
- より時間がかかるが、実際のビルドエラーも確認できる

### 方法4: IDEの診断機能
- VSCodeなどのIDEではリアルタイムで型エラーを表示
- `<new-diagnostics>`タグで新しい診断結果が通知される

## 注意点
- 型エラーがある場合、ビルドは失敗する
- ESLintの警告（例: `<img>`タグ使用の警告）は型エラーではないため、ビルドは成功する
- 型チェックは実装後、特にAPIレスポンスの型変換（Date型など）を行った場合に必ず実行すべき

## 品質チェックの推奨順序
実装完了後、以下の順序でチェックを実行することを推奨:
1. `npm run typecheck` - 型チェック
2. `npm run lint` - ESLint
3. `npm run test` - ユニット/統合テスト
