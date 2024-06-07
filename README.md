# Breakout

## Introduction / Summary

Breakout is a fun speed networking experience.

## Key Features

- Be assigned into groups which will switch in timed intervals
- Admins set the configurations
- Be nice and interact with your partners

### Canvas elements & interactions

- Key Asset - Breakout Sign: When clicked this asset will open the drawer and allow users and admins to start interacting with the app.

### Drawer content

- How to configure instructions
- Configuration Screen
- Countdowns and Round Counter

### Admin features

- Access: Click on the key asset to open the drawer and then select the Admin tab. Any changes you make here will only affect this instance of the application and will not impact other instances dropped in this or other worlds.

- Admins can configure and start a breakout session. Anyone who is in the breakout area at the start of a round will be included in the experience.
-  The number of groups may be adjusted at the start of a round to account for the increase or decrease in the number of participants.
-  The Admin who started the breakout session cannot leave the world while the session is in progress, otherwise it will be halted.




### Data objects

_We use data objects to store information about each implementation of the app per world._

- Key Asset: the data object attached to the dropped key asset will store information related to this specific implementation of the app and would be deleted if the key asset is removed from world. Example data:
  - isResetInProgress
  - lastInteraction
  - lastPlayerTurn
  - playerCount
  - resetCount
  - turnCount
- World: the data object attached to the world will store analytics information for every instance of the app in a given world by keyAssetId and will persist even if a specific instance is removed from world. Example data:
  - gamesPlayedByUser (`keyAssets.${assetId}.gamesPlayedByUser.${profileId}.count`)
  - gamesWonByUser (`keyAssets.${keyAssetId}.gamesWonByUser.${profileId}.count`)
  - totalGamesResetCount (`keyAssets.${assetId}.totalGamesResetCount`)
  - totalGamesWonCount (`keyAssets.${assetId}.totalGamesWonCount`)

## Developers:

### Getting Started

- Clone this repository
- Run `npm i` in server
- `cd client`
- Run `npm i` in client
- `cd ..` back to project root
- Run `npm i` in project root
- Run `npm run dev`

### Add your .env environmental variables

```json
API_KEY=xxxxxxxxxxxxx
INSTANCE_DOMAIN=api.topia.io
INSTANCE_PROTOCOL=https
INTERACTIVE_KEY=xxxxxxxxxxxxx
INTERACTIVE_SECRET=xxxxxxxxxxxxxx
```

### Where to find API_KEY, INTERACTIVE_KEY and INTERACTIVE_SECRET

[Topia Dev Account Dashboard](https://dev.topia.io/t/dashboard/integrations)

[Topia Production Account Dashboard](https://topia.io/t/dashboard/integrations)

### Helpful links

- [SDK Developer docs](https://metaversecloud-com.github.io/mc-sdk-js/index.html)
- [View it in action!](topia.io/appname-prod)
- [Notion One Pager](https://www.notion.so/topiaio/6257c74f9532449b842cfe557975c826?v=8cdffb024588478caeee0cecb8989e82&pvs=4)
- To see an example of an on canvas turn based game check out TicTacToe:
  - [github](https://github.com/metaversecloud-com/sdk-tictactoe)
  - [demo](https://topia.io/tictactoe-prod)
