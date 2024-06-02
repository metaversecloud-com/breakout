import { Visitor } from "@rtsdk/topia";
import { errorHandler } from "../errorHandler.js";

export default async function closeIframeForVisitors(visitors: { [key: string]: Visitor }, droppedAssetId: string) {
  if (process.env.NODE_ENV === "development") {
    return;
  }
  const promises: Promise<any>[] = [];
  const visitorsArr = Object.values(visitors);
  if (visitorsArr && visitorsArr.length > 0) {
    visitorsArr.forEach((visitor) => {
      if (visitor) {
        promises.push(visitor.closeIframe(droppedAssetId));
      }
    });
  }
  console.log(`Closing iframes for ${visitorsArr.length} visitors in ${droppedAssetId}`);
  try {
    await Promise.allSettled(promises);
  } catch (error: any) {
    debugger;
    return errorHandler({
      error,
      functionName: "closeIframeForVisitors",
      message: "Error close Iframes",
    });
  }
}
