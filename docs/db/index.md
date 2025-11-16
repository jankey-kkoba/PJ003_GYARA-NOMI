# マイグレーション運用方針
- スキーマはDrizzleで管理する
- マイグレーションファイルについては`npm run db:generate`を実行して作成する
- マイグレーションファイルの出力先はsupabase/migrationsとする
- マイグレーション実行はsupabase cliで行うこととする
- マイグレーションファイル作成の際はデフォルトの設定であるランダム文字列で作成するのではなく「create-users-table」のようなわかりやすい名称をkebab-caseで作成するようにする
- 単純なスキーマ変更については上記のの方法で行うが、realtime publication追加などといったdrizzleで対応していないような内容については`--custom`で空のファイルを生成してそこで設定するようにする