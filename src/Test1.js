import { Canvas, useFrame } from "@react-three/fiber";
import React, { useRef, useState } from "react";
import { config, useSpring, animated } from "@react-spring/three";

function Box(props) {
  const ref = useRef();
  const [clicked, setClicked] = useState(false);
  const [hovered, setHovered] = useState(false);

  useFrame(() => {
    ref.current.rotation.x += 0.01;
    ref.current.rotation.y += 0.01;
  });

  const { scale } = useSpring({
    scale: clicked ? 2 : 1,
    config: config.wobbly,
  });

  return (
    <animated.mesh
      ref={ref}
      {...props}
      onClick={() => setClicked((prev) => !prev)}
      onPointerOver={() => setHovered((prev) => !prev)}
      onPointerOut={() => setHovered((prev) => !prev)}
      scale={scale}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={hovered ? "orange" : "pink"} />
    </animated.mesh>
  );
}

const Test = () => {
  return (
    <Canvas>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <Box position={[-2, 0, 0]} />
      <Box position={[2, 0, 0]} />
    </Canvas>
  );
};

export default Test;
