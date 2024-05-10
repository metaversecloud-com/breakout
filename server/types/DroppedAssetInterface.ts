import { DroppedAsset } from "@rtsdk/topia";

export interface BreakoutDataObject {
  participants: string[];
  matches: string[];
  numOfRounds: number;
  secondsPerRound: number;
  startTime: number;
  status: "waiting" | "active";
}

export interface IDroppedAsset extends DroppedAsset {
  dataObject?: BreakoutDataObject;
}
