import * as THREE from "three";
import { useRef, useReducer, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  useGLTF,
  MeshTransmissionMaterial,
  Environment,
  Lightformer,
  Circle,
} from "@react-three/drei";
import {
  CuboidCollider,
  BallCollider,
  Physics,
  RigidBody,
  TrimeshCollider,
} from "@react-three/rapier";
import { EffectComposer, N8AO } from "@react-three/postprocessing";
import { easing } from "maath";
import { func } from "three/examples/jsm/nodes/Nodes.js";
import { useLoader } from "@react-three/fiber";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader";

const accents = ["#4060ff", "#20ffa0", "#ff4060", "#ffcc00"];
const shuffle = (accent = 0) => [
  { color: "#444", roughness: 0.1 },
  { color: "#444", roughness: 0.75 },
  { color: "#444", roughness: 0.75 },
  //   { color: "white", roughness: 0.1 },
  //   { color: "white", roughness: 0.75 },
  //   { color: "white", roughness: 0.1 },
  //   { color: accents[accent], roughness: 0.1, accent: true },
  //   { color: accents[accent], roughness: 0.75, accent: true },
  //   { color: accents[accent], roughness: 0.1, accent: true },
];

// 3Dシーンのコンポーネント
export default function Test2(props) {
  const [accent, click] = useReducer((state) => ++state % accents.length, 0);
  // 各オブジェクトの色や質感をランダム化
  const connectors = useMemo(() => shuffle(accent), [accent]);
  return (
    // Canvasコンポーネントで3Dシーンを構築
    <Canvas
      onClick={click} // クリック時にアクセント色を変更
      shadows // シャドウを有効化
      dpr={[1, 1.5]} // デバイスピクセル比を設定
      gl={{ antialias: false }} // アンチエイリアスを無効化
      camera={{ position: [0, 0, 15], fov: 17.5, near: 1, far: 20 }}
      {...props}
    >
      {/* 初期背景 */}
      <color attach="background" args={["#fff"]} />

      {/* ライトの設定 */}
      <ambientLight intensity={0.4} />
      <spotLight
        position={[10, 10, 10]}
        angle={0.15} // 光の角度
        penumbra={1} // 光の柔らかさ
        intensity={1} // 光の強さ
        castShadow // シャドウを有効化
      />

      {/* Physicsで物理エンジンを適用 */}
      <Physics /*debug*/ gravity={[0, 0, 0]}>
        {/* ポインター */}
        <Pointer />

        {/* Connectorコンポーネントを複数生成 */}
        {
          connectors.map((props, i) => <Connector key={i} {...props} />) /* prettier-ignore */
        }
        <Connector position={[10, 10, 5]}>
          <Model>
            {/* ガラス風の光の透過マテリアルを設定 */}
            <MeshTransmissionMaterial
              clearcoat={1} // クリアコート（反射の強さ），１で最大（ガラスのような光沢）
              thickness={0.1} // 厚みの影響度（ガラスの厚み）
              anisotropicBlur={0.1} // 異方性ぼかし（透明部分のぼやけ具合）
              chromaticAberration={0.1} // 色収差（光の屈折による虹色のにじみ）
              samples={8} // レンダリング時のサンプリング数（高いほど滑らか）
              resolution={512} // 屈折のテクスチャ解像度（高いほど詳細だが重い）
            />
          </Model>
        </Connector>

        <SVGModel url="/github.svg" />
      </Physics>

      {/* EffectComposerでポストプロセスエフェクト(ポストプロセス処理)を適用 */}
      <EffectComposer disableNormalPass multisampling={8}>
        {/* N8AOでアンビエントオクルージョン(影の奥行き)を適用 */}
        <N8AO distanceFalloff={1} aoRadius={1} intensity={4} />
      </EffectComposer>

      {/* Environmentで環境マップを適用 */}
      <Environment resolution={256}>
        <group rotation={[-Math.PI / 3, 0, 1]}>
          <Lightformer
            form="circle"
            intensity={4}
            rotation-x={Math.PI / 2}
            position={[0, 5, -9]}
            scale={2}
          />
          <Lightformer
            form="circle"
            intensity={2}
            rotation-y={Math.PI / 2}
            position={[-5, 1, -1]}
            scale={2}
          />
          <Lightformer
            form="circle"
            intensity={2}
            rotation-y={Math.PI / 2}
            position={[-5, -1, -1]}
            scale={2}
          />
          <Lightformer
            form="circle"
            intensity={2}
            rotation-y={-Math.PI / 2}
            position={[10, 1, 0]}
            scale={8}
          />
        </group>
      </Environment>
    </Canvas>
  );
}

// オブジェクトの物理演算を行うコンポーネント
function Connector({
  position,
  children,
  vec = new THREE.Vector3(),
  scale,
  r = THREE.MathUtils.randFloatSpread,
  accent,
  ...props
}) {
  const api = useRef();
  // 指定されていない場合は randFloatSpread(10) を使ってランダムな初期位置を設定
  const pos = useMemo(() => position || [r(10), r(10), r(10)], []);

  // フレームごとに物理演算を適用
  useFrame((state, delta) => {
    delta = Math.min(0.1, delta);
    // オブジェクトを中心に引っ張る力を加えている
    // applyImpulse を使って，オブジェクトを中央に向かうように動かす
    // negate().multiplyScalar(0.2) によって，現在の位置の逆方向に力を加える
    api.current?.applyImpulse(
      vec.copy(api.current.translation()).negate().multiplyScalar(0.2)
    );
  });
  // RigidBodyで物理演算を適用
  return (
    <RigidBody
      linearDamping={4} // 線形ダンピング
      angularDamping={1} // 角速度ダンピング
      friction={0.1} // 摩擦
      position={pos} // 位置
      ref={api}
      colliders={false} // コライダーを無効化
    >
      {/* 3 つの CuboidCollider を使ってオブジェクトの衝突判定を設定 */}
      {/* 3つのパイプだからか */}
      <CuboidCollider args={[0.38, 1.27, 0.38]} />
      <CuboidCollider args={[1.27, 0.38, 0.38]} />
      <CuboidCollider args={[0.38, 0.38, 1.27]} />
      {children ? children : <Model {...props} />}
      {accent && (
        // アクセント色のポイントライト(distanceで影響範囲を指定)
        <pointLight intensity={4} distance={2.5} color={props.color} />
      )}
    </RigidBody>
  );
}

// マウスカーソルの位置を追従するコンポーネント
function Pointer({ vec = new THREE.Vector3() }) {
  // リアルタイムでマウスカーソルの位置を取得し更新
  const ref = useRef();
  useFrame(({ mouse, viewport }) => {
    ref.current?.setNextKinematicTranslation(
      vec.set(
        (mouse.x * viewport.width) / 2,
        (mouse.y * viewport.height) / 2,
        0
      )
    );
  });
  return (
    <RigidBody
      position={[0, 0, 0]} // 初期位置
      type="kinematicPosition" // キネマティックボディ
      colliders={false} // コライダーを無効化
      ref={ref}
    >
      {/* マウスカーソルの形状は球体 */}
      <BallCollider args={[1]} />
    </RigidBody>
  );
}

// 3Dモデルを表示するコンポーネント
function Model({ children, color = "white", roughness = 0, ...props }) {
  const ref = useRef();
  // glTFファイルを読み込む
  const { nodes, materials } = useGLTF("/c-transformed.glb");
  useFrame((state, delta) => {
    // easing.dampC で色を滑らかに変化させる
    easing.dampC(ref.current.material.color, color, 0.2, delta);
  });
  return (
    <mesh
      ref={ref}
      castShadow
      receiveShadow
      scale={10}
      geometry={nodes.connector.geometry}
    >
      {/* マテリアル設定 */}
      <meshStandardMaterial
        metalness={0.2}
        roughness={roughness}
        map={materials.base.map}
      />
      {children}
    </mesh>
  );
}

// SVGの3Dモデルを読み込む
function SVGModel({
  r = THREE.MathUtils.randFloatSpread,
  vec = new THREE.Vector3(),
  url = "/github.svg",
}) {
  // SVGLoader を使ってデータを読み込む
  const svgData = useLoader(SVGLoader, url);

  const pos = useMemo(() => [r(2), r(2), r(2)], []);

  const ref = useRef(); // RigidBody の参照
  useFrame((state, delta) => {
    delta = Math.min(0.1, delta);
    ref.current?.applyImpulse(
      vec
        .copy(ref.current.translation())
        .negate()
        .multiplyScalar(0.02 * delta)
    );
  });

  return (
    <RigidBody
      ref={ref}
      type="dynamic"
      mass={1}
      colliders={false}
      linearDamping={4} // 線形ダンピング
      angularDamping={1} // 角速度ダンピング
      friction={0.1} // 摩擦
      position={pos} // 位置
    >
      {/* 円形の当たり判定 */}
      {/* <BallCollider args={[1]} /> */}
      <CuboidCollider args={[1, 1, 0]} />

      <group position={[0, 0, 0]} scale={0.1} rotation={[Math.PI, 0, 0]}>
        {svgData.paths.map((path, i) => {
          const shapes = path.toShapes(true);

          return shapes.map((shape, j) => {
            return (
              <mesh key={`${i}-${j}`}>
                <extrudeGeometry
                  attach="geometry"
                  args={[shape, { depth: 4, bevelEnabled: true, steps: 10 }]}
                />
                <MeshTransmissionMaterial
                  //   clearcoat={1}
                  //   thickness={10.1}
                  //   anisotropicBlur={10.1}
                  //   chromaticAberration={0.1}
                  //   samples={8}
                  //   resolution={512}
                  clearcoat={1}
                  thickness={5.1}
                  anisotropicBlur={8.1}
                  chromaticAberration={0.1}
                  samples={8}
                  //   resolution={1024}
                />
              </mesh>
            );
          });
        })}
      </group>
    </RigidBody>
  );
}
