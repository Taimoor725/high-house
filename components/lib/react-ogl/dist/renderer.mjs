import * as OGL from "ogl";
import * as React from "react";
import { ConcurrentRoot } from "react-reconciler/constants.js";
import { create } from "zustand";
import { reconciler } from "./reconciler.mjs";
import { OGLContext, useStore, useIsomorphicLayoutEffect } from "./hooks.mjs";
import { applyProps, calculateDpr, prepare } from "./utils.mjs";
const roots = /* @__PURE__ */ new Map();
function render(element, target, {
  dpr = [1, 2],
  size = { width: ((_b) => (_b = ((_a) => (_a = target.parentElement) == null ? void 0 : _a.clientWidth)()) != null ? _b : 0)(), height: ((_d) => (_d = ((_c) => (_c = target.parentElement) == null ? void 0 : _c.clientHeight)()) != null ? _d : 0)() },
  frameloop = "always",
  orthographic = false,
  events,
  ...config
} = {}) {
  var _a2, _b2, _c2;
  let root = roots.get(target);
  if (!root) {
    let animate = function(time = 0, frame) {
      var _a3, _b3;
      const state3 = store.getState();
      const mode = (_a3 = state3.xr.session) != null ? _a3 : window;
      if (state3.frameloop === "never")
        return mode.cancelAnimationFrame(nextFrame);
      nextFrame = mode.requestAnimationFrame(animate);
      for (const ref of state3.subscribed)
        (_b3 = ref.current) == null ? void 0 : _b3.call(ref, state3, time, frame);
      if (state3.priority)
        return;
      state3.renderer.render({ scene: state3.scene, camera: state3.camera });
    }, onResize = function(state3) {
      const { width, height } = state3.size;
      const projection = state3.orthographic ? "orthographic" : "perspective";
      if (state3.renderer.width !== width || state3.renderer.height !== height || state3.camera.type !== projection) {
        state3.renderer.setSize(width, height);
        state3.camera[projection]({ aspect: width / height });
      }
    };
    const store = create((set, get) => {
      var _a3;
      const renderer = config.renderer instanceof OGL.Renderer ? config.renderer : typeof config.renderer === "function" ? config.renderer(target) : new OGL.Renderer({
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
        ...config.renderer,
        canvas: target
      });
      if (config.renderer && typeof config.renderer !== "function")
        applyProps(renderer, config.renderer);
      renderer.dpr = calculateDpr(dpr);
      const gl = renderer.gl;
      gl.clearColor(1, 1, 1, 0);
      const camera = config.camera instanceof OGL.Camera ? config.camera : new OGL.Camera(gl, { fov: 75, near: 1, far: 1e3, ...config.camera });
      camera.position.z = 5;
      if (config.camera)
        applyProps(camera, config.camera);
      return {
        size,
        xr: {
          session: null,
          setSession(session) {
            set((state3) => ({ xr: { ...state3.xr, session } }));
          },
          connect(session) {
            get().xr.setSession(session);
          },
          disconnect() {
            get().xr.setSession(null);
          }
        },
        renderer,
        frameloop,
        orthographic,
        gl,
        camera,
        scene: (_a3 = config.scene) != null ? _a3 : new OGL.Transform(),
        priority: 0,
        subscribed: [],
        subscribe(refCallback, renderPriority = 0) {
          const { subscribed } = get();
          subscribed.push(refCallback);
          set((state3) => ({ priority: state3.priority + renderPriority }));
        },
        unsubscribe(refCallback, renderPriority = 0) {
          const { subscribed } = get();
          const index = subscribed.indexOf(refCallback);
          if (index !== -1)
            subscribed.splice(index, 1);
          set((state3) => ({ priority: state3.priority - renderPriority }));
        },
        events,
        mouse: new OGL.Vec2(),
        raycaster: new OGL.Raycast(),
        hovered: /* @__PURE__ */ new Map(),
        set,
        get
      };
    });
    const state2 = store.getState();
    prepare(state2.scene, store, "", {});
    if (((_a2 = state2.events) == null ? void 0 : _a2.connect) && !((_b2 = state2.events) == null ? void 0 : _b2.connected))
      state2.events.connect(target, state2);
    (_c2 = config.onCreated) == null ? void 0 : _c2.call(config, state2);
    let nextFrame;
    if (state2.frameloop !== "never")
      animate();
    store.subscribe(onResize);
    onResize(state2);
    const logRecoverableError = typeof reportError === "function" ? reportError : console.error;
    const container = reconciler.createContainer(
      store,
      ConcurrentRoot,
      null,
      false,
      null,
      "",
      logRecoverableError,
      null
    );
    root = { container, store };
    roots.set(target, root);
  }
  const state = root.store.getState();
  if (state.size.width !== size.width || state.size.height !== size.height)
    state.set(() => ({ size }));
  if (state.frameloop !== frameloop)
    state.set(() => ({ frameloop }));
  if (state.orthographic !== orthographic)
    state.set(() => ({ orthographic }));
  reconciler.updateContainer(
    /* @__PURE__ */ React.createElement(OGLContext.Provider, {
      value: root.store
    }, element),
    root.container,
    null,
    () => void 0
  );
  return root.store;
}
function unmountComponentAtNode(target) {
  const root = roots.get(target);
  if (!root)
    return;
  reconciler.updateContainer(null, root.container, null, () => {
    var _a;
    roots.delete(target);
    const state = root.store.getState();
    state.set(() => ({ frameloop: "never" }));
    if ((_a = state.events) == null ? void 0 : _a.disconnect)
      state.events.disconnect(target, state);
  });
}
const createRoot = (target, config) => ({
  render: (element) => render(element, target, config),
  unmount: () => unmountComponentAtNode(target)
});
function PortalRoot({ children, target, state }) {
  const store = useStore();
  const container = React.useMemo(
    () => create((set, get) => ({
      ...store.getState(),
      set,
      get,
      scene: target
    })),
    [store, target]
  );
  useIsomorphicLayoutEffect(() => {
    const { set, get, scene } = container.getState();
    return store.subscribe((parentState) => container.setState({ ...parentState, ...state, set, get, scene }));
  }, [container, store, state]);
  return /* @__PURE__ */ React.createElement(React.Fragment, null, reconciler.createPortal(
    /* @__PURE__ */ React.createElement(OGLContext.Provider, {
      value: store
    }, children),
    container,
    null,
    null
  ));
}
function createPortal(children, target, state) {
  return /* @__PURE__ */ React.createElement(PortalRoot, {
    target,
    state
  }, children);
}
export {
  createPortal,
  createRoot,
  render,
  unmountComponentAtNode
};
//# sourceMappingURL=renderer.mjs.map
