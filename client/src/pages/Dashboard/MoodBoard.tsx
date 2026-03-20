import { DashboardLayout } from "@/components/DashboardLayout";
import { PageTransition, StaggerContainer, FadeInUp } from "@/components/PageTransition";
import { HoverCard3D } from "@/components/HoverCard3D";
import { useState } from "react";
import { mockData } from "@/lib/mock-data";
import { Map, Plus, Image as ImageIcon, Video, Type } from "lucide-react";

type CanvasElement = {
    id: number;
    type: 'image' | 'video' | 'note';
    x: number;
    y: number;
    title: string;
    content: string;
};

export default function MoodBoard() {
    const [elements, setElements] = useState<CanvasElement[]>([
        {
            id: 1,
            type: 'image',
            x: 15,
            y: 10,
            title: "Cinematic Lighting Ref",
            content: "Great use of practical lights for background separation without looking overly produced."
        },
        {
            id: 2,
            type: 'note',
            x: 60,
            y: 40,
            title: "Voiceover Tone",
            content: "Need to shift from 'teaching' to 'exploring together'. The pacing should feel more like a detective story than a lecture."
        },
        {
            id: 3,
            type: 'video',
            x: 35,
            y: 60,
            title: "Competitor Breakout",
            content: "High CRPS Reference - structure analysis."
        }
    ]);

    const addElement = (type: 'image' | 'video' | 'note') => {
        const newEl: CanvasElement = {
            id: Date.now(),
            type,
            x: Math.floor(Math.random() * 60) + 10,
            y: Math.floor(Math.random() * 60) + 10,
            title: type === 'image' ? "New Image Ref" : type === 'note' ? "New Sticky Note" : "New Video Link",
            content: "Double click to edit contents..."
        };
        setElements([...elements, newEl]);
    };
    return (
        <PageTransition>
            <DashboardLayout title="Semantic Mood Board">

                <div className="flex flex-col gap-8 mb-6 md:flex-row md:items-end md:justify-between">
                    <div>
                        <h2 className="font-display font-bold text-4xl mb-3">Creative Canvas</h2>
                        <p className="text-content-secondary max-w-2xl text-sm leading-relaxed mb-4">
                            A free-form spatial playground for collecting multimedia inspiration.
                            <strong className="text-brand-teal font-normal block mt-2">
                                How it works:
                            </strong>
                            Add reference images, competitor video links, or brain-dump notes to the board.
                            Items that you cluster closely together are semantically blended by the Ideas Engine to generate novel, hybrid video concepts through collision mapping.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => addElement('image')} className="h-10 px-4 rounded-md bg-space-800 border border-borderBase hover:bg-space-700 transition-colors flex items-center gap-2 text-sm font-medium">
                            <ImageIcon className="w-4 h-4" /> Image
                        </button>
                        <button onClick={() => addElement('video')} className="h-10 px-4 rounded-md bg-space-800 border border-borderBase hover:bg-space-700 transition-colors flex items-center gap-2 text-sm font-medium">
                            <Video className="w-4 h-4 text-brand-teal" /> Link
                        </button>
                        <button onClick={() => addElement('note')} className="h-10 px-4 rounded-md bg-space-800 border border-borderBase hover:bg-space-700 transition-colors flex items-center gap-2 text-sm font-medium">
                            <Type className="w-4 h-4 text-brand-violet" /> Note
                        </button>
                    </div>
                </div>

                <div className="relative w-full h-[calc(100vh-220px)] bg-space-800/30 rounded-2xl border border-borderBase overflow-hidden group">

                    {/* Grid Background */}
                    <div className="absolute inset-0 opacity-10"
                        style={{
                            backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)',
                            backgroundSize: '40px 40px'
                        }}
                    />

                    {/* Spatial UI Elements (Simulated draggables) */}
                    <StaggerContainer className="absolute inset-0">

                        {elements.map((el, i) => (
                            <div key={el.id} className="absolute cursor-move" style={{ top: `${el.y}%`, left: `${el.x}%`, zIndex: i }}>
                                <FadeInUp delay={Math.min(i * 0.1, 0.5)}>
                                    {el.type === 'image' && (
                                        <HoverCard3D glowColor="teal" className="w-[300px] hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)]">
                                            <div className="p-4 flex flex-col gap-3">
                                                <div className="w-full h-32 bg-brand-teal/10 rounded-lg flex items-center justify-center border border-brand-teal/20">
                                                    <ImageIcon className="w-8 h-8 text-brand-teal/50" />
                                                </div>
                                                <div>
                                                    <h4 className="font-body font-bold text-sm">{el.title}</h4>
                                                    <p className="text-xs text-content-secondary line-clamp-2 mt-1">{el.content}</p>
                                                </div>
                                            </div>
                                        </HoverCard3D>
                                    )}

                                    {el.type === 'note' && (
                                        <HoverCard3D glowColor="amber" className="w-[280px]">
                                            <div className="p-5 flex flex-col gap-2 bg-[#F59E0B]/5 border-[#F59E0B]/20 rounded-xl">
                                                <Type className="w-5 h-5 text-brand-amber mb-2" />
                                                <h4 className="font-display font-bold text-lg text-content-primary">{el.title}</h4>
                                                <p className="text-sm text-content-secondary leading-relaxed">{el.content}</p>
                                            </div>
                                        </HoverCard3D>
                                    )}

                                    {el.type === 'video' && (
                                        <HoverCard3D glowColor="violet" className="w-[320px]">
                                            <div className="p-4 flex flex-col gap-3">
                                                <div className="flex items-start gap-3">
                                                    <div className="w-10 h-10 rounded bg-brand-violet/20 flex items-center justify-center shrink-0">
                                                        <Video className="w-5 h-5 text-brand-violet" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-body font-bold text-sm">{el.title}</h4>
                                                        <p className="text-xs text-content-secondary mt-1">{el.content}</p>
                                                        <span className="text-[10px] uppercase font-bold text-brand-violet bg-brand-violet/10 px-2 py-0.5 rounded mt-2 inline-block">High CRPS Reference</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </HoverCard3D>
                                    )}
                                </FadeInUp>
                            </div>
                        ))}

                        {/* Empty State / Call to Action */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="px-6 py-3 rounded-full bg-space-900 border border-content-tertiary/20 text-content-tertiary text-sm font-medium flex items-center gap-2 opacity-50">
                                <Map className="w-4 h-4" /> Infinite Spatial Canvas
                            </div>
                        </div>

                    </StaggerContainer>

                    {/* Zoom Controls */}
                    <div className="absolute bottom-6 right-6 flex items-center gap-1 bg-space-900 p-1 rounded-lg border border-borderBase">
                        <button className="w-8 h-8 flex items-center justify-center hover:bg-space-800 rounded font-mono text-content-secondary">+</button>
                        <span className="text-xs font-mono text-content-tertiary px-2">100%</span>
                        <button className="w-8 h-8 flex items-center justify-center hover:bg-space-800 rounded font-mono text-content-secondary">-</button>
                    </div>
                </div>
            </DashboardLayout>
        </PageTransition>
    );
}
