const AdminIconButton = ({
  setShowSettings,
  showSettings,
}: {
  setShowSettings: (value: boolean) => void;
  showSettings: boolean;
}) => {
  return (
    <button
      type="button"
      className="btn btn-icon icon-with-rounded-border mb-4"
      onClick={() => setShowSettings(!showSettings)}
      aria-label={showSettings ? "Back to home" : "Open admin settings"}
      aria-pressed={showSettings}
    >
      <img
        src={`https://sdk-style.s3.amazonaws.com/icons/${showSettings ? "arrow" : "cog"}.svg`}
        alt=""
        aria-hidden="true"
      />
    </button>
  );
};

export default AdminIconButton;
