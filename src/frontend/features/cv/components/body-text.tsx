import { parseBody } from '../lib';

export function BodyText({ text }: { text: string }) {
  const { lead, bullets } = parseBody(text);
  return (
    <div className="grid gap-1.5">
      {lead.map((line, i) => (
        <p key={i}>{line}</p>
      ))}
      {bullets.length > 0 && (
        <ul className="grid list-disc gap-1 pl-4">
          {bullets.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
