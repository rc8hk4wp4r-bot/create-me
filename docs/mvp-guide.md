# MVPの使い方（Milestone 0-2）

## Home（3ブロック固定）
1. **Proposal Card**
   - 今日の提案を1行で表示。
   - `Accept` or `Downgrade` で提案を採用/再交渉。
2. **Quick Logger**
   - 最大5習慣。
   - `1..5` で完了トグル。
   - `Shift+1..5` で強度を S→M→L に上げる。
3. **Mini Band**
   - `Overreaching / On Track / Drifting` を短文表示。

## キーボード
- `1..5`: その習慣の完了切替
- `Shift+1..5`: 強度アップ
- `P`: 提案Accept
- `D`: 提案Downgrade

## 現状の制約
- 認証/Stripe/本番Supabase接続は Milestone 3以降。
- 現時点は `.demo-data.json` を使うローカルデモモードを同梱。
