import { BookOpen, Layers3, Sparkles } from "lucide-react";

// Local covers need no external image service or database changes.
export function CourseArt({ title, index = 0 }: { title: string; index?: number }) {
  return (
    <div className={`course-art art-${index % 3}`} aria-hidden="true">
      <div className="art-orbit" />
      <div className="art-orbit orbit-two" />
      <span className="art-label">PICTOPAY / LEARNING</span>
      <span className="art-symbol">
        {index % 3 === 0 ? <Layers3 /> : index % 3 === 1 ? <BookOpen /> : <Sparkles />}
      </span>
      <span className="art-title">{title}</span>
      <span className="art-number">{String(index + 1).padStart(2, "0")}</span>
    </div>
  );
}
