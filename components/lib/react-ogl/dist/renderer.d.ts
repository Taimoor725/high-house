import * as OGL from 'ogl';
import * as React from 'react';
import { RenderProps, Root, RootState, RootStore } from './types';
/**
 * Renders React elements into OGL elements.
 */
export declare function render(element: React.ReactNode, target: HTMLCanvasElement, { dpr, size, frameloop, orthographic, events, ...config }?: RenderProps): RootStore;
/**
 * Removes and cleans up internals on unmount.
 */
export declare function unmountComponentAtNode(target: HTMLCanvasElement): void;
/**
 * Creates a root to safely render/unmount.
 */
export declare const createRoot: (target: HTMLCanvasElement, config?: RenderProps) => Root;
/**
 * Portals into a remote OGL element.
 */
export declare function createPortal(children: React.ReactElement, target: OGL.Transform, state?: Partial<RootState>): JSX.Element;
