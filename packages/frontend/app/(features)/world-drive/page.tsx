import MapFrame from "./_components/MapFrame";
import QRSetup from "./_components/QRSetup";

export default function WorldDrivePage() {
  return (
    <div className="flex-1 relative">
      <MapFrame />
      <div className="absolute top-4 right-4 z-[1000]">
        <QRSetup />
      </div>
    </div>
  );
}
