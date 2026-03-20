import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Sphere, Line } from "@react-three/drei";
import * as THREE from "three";

// Simulated Clusters for the World Model sphere
const NUM_NODES = 40;
const RADIUS = 4;

function Network() {
    const group = useRef<THREE.Group>(null);

    // Generate random positions on a sphere
    const nodes = useMemo(() => {
        const temp = [];
        for (let i = 0; i < NUM_NODES; i++) {
            const phi = Math.acos(-1 + (2 * i) / NUM_NODES);
            const theta = Math.sqrt(NUM_NODES * Math.PI) * phi;
            const x = RADIUS * Math.cos(theta) * Math.sin(phi);
            const y = RADIUS * Math.sin(theta) * Math.sin(phi);
            const z = RADIUS * Math.cos(phi);

            // Random coloring (Teal, Violet, Amber)
            const rand = Math.random();
            let color = "#1DFFD2"; // Teal
            if (rand > 0.6) color = "#8B5CF6";     // Violet
            else if (rand > 0.85) color = "#F59E0B"; // Amber

            // Scale variance
            const scale = 0.5 + Math.random() * 1.5;

            temp.push({ position: new THREE.Vector3(x, y, z), color, scale });
        }
        return temp;
    }, []);

    // Generate edges between close nodes
    const lines = useMemo(() => {
        const temp: { start: THREE.Vector3; end: THREE.Vector3; color: string }[] = [];
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const dist = nodes[i].position.distanceTo(nodes[j].position);
                if (dist < 3.5) { // connect if close
                    temp.push({
                        start: nodes[i].position,
                        end: nodes[j].position,
                        color: nodes[i].color // blend or inherit color 
                    });
                }
            }
        }
        return temp;
    }, [nodes]);

    // Slow rotation
    useFrame((state, delta) => {
        if (group.current) {
            group.current.rotation.y += delta * 0.1;
            group.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
        }
    });

    return (
        <group ref={group}>
            {/* Edges */}
            {lines.map((line, i) => (
                <Line
                    key={`line-${i}`}
                    points={[line.start, line.end]}
                    color={line.color}
                    lineWidth={0.5}
                    transparent
                    opacity={0.3}
                />
            ))}
            {/* Nodes */}
            {nodes.map((node, i) => (
                <Sphere key={`node-${i}`} position={node.position} args={[0.2 * node.scale, 16, 16]}>
                    <meshBasicMaterial color={node.color} toneMapped={false} />
                </Sphere>
            ))}
        </group>
    );
}

export function WorldModelSphere() {
    return (
        <div className="w-full h-full absolute inset-0 mix-blend-screen pointer-events-none md:pointer-events-auto">
            <Canvas camera={{ position: [0, 0, 10], fov: 45 }}>
                <ambientLight intensity={0.5} />
                <Network />
                <OrbitControls
                    enableZoom={false}
                    enablePan={false}
                    autoRotate
                    autoRotateSpeed={0.5}
                    minPolarAngle={Math.PI / 3}
                    maxPolarAngle={Math.PI / 1.5}
                />
                {/* Subtle bloom/glow effect can be achieved using @react-three/postprocessing, 
            but keeping it lightweight here to ensure fast loading and stability */}
            </Canvas>
            {/* Radial overlay to blend edges into background */}
            <div className="absolute inset-0 pointer-events-none"
                style={{ background: 'radial-gradient(circle at center, transparent 30%, #05060f 70%)' }} />
        </div>
    );
}
