"use client";
//Client Wrapper für page.tsx (Server Comp.)
import dynamic from "next/dynamic";

export default dynamic(() => import("./WorldMap"), { ssr: false });
