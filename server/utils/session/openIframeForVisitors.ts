import { Visitor } from "@rtsdk/topia";
import { errorHandler } from "../errorHandler.js";

export default async function openIframeForVisitors(visitors: { [key: string]: Visitor }, droppedAssetId: string) {
  if (process.env.NODE_ENV === "development") {
    return;
  }

  const promises: Promise<any>[] = [];
  const visitorsArr = Object.values(visitors);
  if (visitorsArr && visitorsArr.length > 0) {
    visitorsArr.forEach((visitor) => {
      visitor
        .openIframe({
          droppedAssetId,
          link: process.env.APP_URL!,
          shouldOpenInDrawer: true,
          title: "Breakout",
        })
        .catch((error: any) =>
          errorHandler({
            error,
            functionName: "openIframeForVisitors",
            message: "Error opening iframe",
          }),
        );
    });
  }
  console.log(`Opening iframes for ${visitorsArr.length} visitors in ${droppedAssetId}`);
  try {
    await Promise.allSettled(promises);
  } catch (error: any) {
    debugger;
    return errorHandler({
      error,
      functionName: "openIframeForVisitors",
      message: "Error opening Iframes",
    });
  }
}
