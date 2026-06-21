import dynamic from "next/dynamic";

// ssr: false because Three.js + canvas cannot run server-side
const World = dynamic(() => import("@/features/world/World"), { ssr: false });

export default function WorldPage() {
  return <World />;
}
