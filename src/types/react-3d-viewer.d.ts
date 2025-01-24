declare module 'react-3d-viewer' {
    interface STLViewerProps {
        url: string;
        width?: number;
        height?: number;
        modelColor?: string;
        backgroundColor?: string;
        rotate?: boolean;
        orbitControls?: boolean;
    }

    export const STLViewer: React.ComponentType<STLViewerProps>;
}