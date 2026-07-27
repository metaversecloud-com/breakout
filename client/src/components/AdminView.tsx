import { useContext, useEffect, useState } from "react";
import { GlobalStateContext } from "@/context/GlobalContext";
import { InitialState } from "@/context/types";

import STONE_SM from "@/assets/STONE_SM.jpg";
import STONE_LG from "@/assets/STONE_LG.jpg";
import COLOR_SM from "@/assets/COLOR_SM.jpg";
import COLOR_LG from "@/assets/COLOR_LG.jpg";
import WOOD_SM from "@/assets/WOOD_SM.jpg";
import WOOD_LG from "@/assets/WOOD_LG.jpg";

/**
 * Preview images bundled with the client, keyed by the same `key` the
 * server returns from `GET /scenes`. Adding a new scene = add its
 * preview here + the server-side catalog + env var.
 */
const PREVIEWS: Record<string, string> = {
  STONE_SM,
  STONE_LG,
  COLOR_SM,
  COLOR_LG,
  WOOD_SM,
  WOOD_LG,
};

interface Scene {
  key: string;
  title: string;
}

const AdminView = () => {
  const { backendAPI } = useContext(GlobalStateContext) as InitialState;

  const [scenes, setScenes] = useState<Scene[]>([]);
  const [selectedKey, setSelectedKey] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [swapping, setSwapping] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    if (!backendAPI) return;
    let cancelled = false;
    backendAPI
      .get("/scenes")
      .then((res) => {
        if (cancelled) return;
        const list: Scene[] = res.data?.scenes ?? [];
        setScenes(list);
      })
      .catch((err) => {
        if (cancelled) return;
        setErrorMessage(
          err?.response?.data?.error?.message ??
            err?.response?.data?.message ??
            err?.message ??
            "Failed to load scenes.",
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [backendAPI]);

  const handleReplace = async () => {
    if (!backendAPI || !selectedKey || swapping) return;
    setSwapping(true);
    setMessage("");
    setErrorMessage("");
    try {
      await backendAPI.post("/replace-scene", { key: selectedKey });
      setMessage("Scene updated successfully.");
    } catch (err: any) {
      setErrorMessage(
        err?.response?.data?.error?.message ??
          err?.response?.data?.message ??
          err?.message ??
          "Something went wrong while swapping the scene.",
      );
    } finally {
      setSwapping(false);
    }
  };

  if (loading) {
    return <p className="p2 !my-4">Loading scenes...</p>;
  }

  if (scenes.length === 0) {
    return (
      <div className="w-full">
        <p className="p2 !my-4">
          No scenes are configured. Set one or more <code>SCENE_ID_*</code> env vars to enable the picker.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center">
      <h2 className="h4 !mb-2 text-center">Swap the world scene</h2>
      <p className="p2 text-center !mb-4">
        Pick a preset below and click <strong>Update Scene</strong> to swap it in.
      </p>

      <div className="w-full mb-6">
        {scenes.map((scene) => {
          const previewSrc = PREVIEWS[scene.key];
          const isSelected = selectedKey === scene.key;
          return (
            <div key={scene.key} className="mb-2" onClick={() => setSelectedKey(scene.key)}>
              <div className={`card small cursor-pointer ${isSelected ? "success" : ""}`}>
                <div className="card-image">
                  {previewSrc ? (
                    <img src={previewSrc} alt={scene.title} style={{ maxHeight: "100%" }} />
                  ) : (
                    <div className="p3 p-2 text-center">No preview</div>
                  )}
                </div>
                <div className="card-details overflow-hidden">
                  <h4 className="card-title truncate">{scene.title}</h4>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {message && <p className="text-success py-2">{message}</p>}
      {errorMessage && <p className="text-danger py-2">{errorMessage}</p>}

      <button
        type="button"
        className="btn btn-enhanced !w-72"
        disabled={!selectedKey || swapping}
        onClick={handleReplace}
      >
        {swapping ? "Updating..." : "Update Scene"}
      </button>
    </div>
  );
};

export default AdminView;
