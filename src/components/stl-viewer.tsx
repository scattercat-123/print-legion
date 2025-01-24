"use client";

import dynamic from "next/dynamic";

const STLViewer = dynamic(
    () =>
        import("react-3d-viewer").then((mod) => {
            const { STLViewer } = mod;
            return ({ url }: { url: string }) => (
                <STLViewer
                    url={url}
                    width={800}
                    height={400}
                    modelColor="#888888"
                    backgroundColor="#1f1f1f"
                    rotate={true}
                    orbitControls={true}
                />
            );
        }),
    { ssr: false }
);

interface STLViewerProps {
    url: string;
}

export function STLViewerWrapper({ url }: STLViewerProps) {
    return (
        <div className="w-full h-[400px] bg-zinc-900 rounded-lg overflow-hidden flex items-center justify-center">
            <STLViewer url={url} />
        </div>
    );
}
