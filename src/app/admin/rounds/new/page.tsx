"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApp } from "@/providers/app-provider";
import { createRound } from "@/app/admin/actions";
import { Trash2, Plus } from "lucide-react";

interface QuestionForm {
  question_text: string;
  options: [string, string, string, string];
  correct_index: number;
}

interface SeasonOption {
  id: string;
  name: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function NewRoundPage() {
  const { supabase } = useApp();
  const router = useRouter();

  const [seasons, setSeasons] = useState<SeasonOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form fields
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [seasonId, setSeasonId] = useState("");
  const [essayBody, setEssayBody] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [sponsorName, setSponsorName] = useState("");
  const [sponsorLogoUrl, setSponsorLogoUrl] = useState("");
  const [questions, setQuestions] = useState<QuestionForm[]>([
    { question_text: "", options: ["", "", "", ""], correct_index: 0 },
  ]);

  const fetchSeasons = useCallback(async () => {
    const { data } = await supabase
      .from("seasons")
      .select("id, name")
      .eq("is_active", true)
      .order("start_date", { ascending: false });
    if (data) {
      setSeasons(data as SeasonOption[]);
      if (data.length > 0) setSeasonId(data[0].id);
    }
  }, [supabase]);

  useEffect(() => {
    fetchSeasons();
  }, [fetchSeasons]);

  // Auto-generate slug from title
  useEffect(() => {
    if (!slugManuallyEdited) {
      setSlug(slugify(title));
    }
  }, [title, slugManuallyEdited]);

  function addQuestion() {
    setQuestions([
      ...questions,
      { question_text: "", options: ["", "", "", ""], correct_index: 0 },
    ]);
  }

  function removeQuestion(index: number) {
    setQuestions(questions.filter((_, i) => i !== index));
  }

  function updateQuestion(index: number, field: string, value: string | number) {
    setQuestions(
      questions.map((q, i) => {
        if (i !== index) return q;
        return { ...q, [field]: value };
      })
    );
  }

  function updateOption(qIndex: number, oIndex: number, value: string) {
    setQuestions(
      questions.map((q, i) => {
        if (i !== qIndex) return q;
        const newOptions = [...q.options] as [string, string, string, string];
        newOptions[oIndex] = value;
        return { ...q, options: newOptions };
      })
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await createRound({
      title,
      slug,
      season_id: seasonId,
      essay_body: essayBody,
      starts_at: new Date(startsAt).toISOString(),
      sponsor_name: sponsorName || undefined,
      sponsor_logo_url: sponsorLogoUrl || undefined,
      questions,
    });

    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
    }
  }

  if (success) {
    return (
      <div className="py-12 text-center">
        <h2 className="font-(family-name:--font-playfair) text-2xl font-bold text-[#0a2463]">
          Round created!
        </h2>
        <p className="mt-2 text-sm text-[#1a1a2e]/60">
          The round and its questions have been saved.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button
            onClick={() => {
              setSuccess(false);
              setTitle("");
              setSlug("");
              setSlugManuallyEdited(false);
              setEssayBody("");
              setStartsAt("");
              setSponsorName("");
              setSponsorLogoUrl("");
              setQuestions([
                { question_text: "", options: ["", "", "", ""], correct_index: 0 },
              ]);
            }}
            className="bg-[#0a2463] text-white hover:bg-[#0a2463]/90"
          >
            Create another
          </Button>
          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 font-(family-name:--font-playfair) text-2xl font-bold text-[#0a2463]">
        Create New Round
      </h1>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Round Details */}
        <section className="space-y-4 rounded-xl bg-white/60 p-6 shadow-sm backdrop-blur-sm">
          <h2 className="font-(family-name:--font-playfair) text-lg font-semibold text-[#0a2463]">
            Round Details
          </h2>

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. The Future of Education"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugManuallyEdited(true);
              }}
              placeholder="the-future-of-education"
              required
            />
            <p className="text-xs text-[#1a1a2e]/40">
              Auto-generated from title. Edit to customize.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="season">Season</Label>
            <select
              id="season"
              value={seasonId}
              onChange={(e) => setSeasonId(e.target.value)}
              required
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              {seasons.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="essay_body">Essay Body</Label>
            <textarea
              id="essay_body"
              value={essayBody}
              onChange={(e) => setEssayBody(e.target.value)}
              placeholder="Write or paste the essay content here..."
              required
              rows={10}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="starts_at">Starts At</Label>
            <Input
              id="starts_at"
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sponsor_name">Sponsor Name (optional)</Label>
              <Input
                id="sponsor_name"
                value={sponsorName}
                onChange={(e) => setSponsorName(e.target.value)}
                placeholder="Sponsor Inc."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sponsor_logo_url">
                Sponsor Logo URL (optional)
              </Label>
              <Input
                id="sponsor_logo_url"
                value={sponsorLogoUrl}
                onChange={(e) => setSponsorLogoUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>
        </section>

        {/* Questions */}
        <section className="space-y-4 rounded-xl bg-white/60 p-6 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-(family-name:--font-playfair) text-lg font-semibold text-[#0a2463]">
              Questions ({questions.length})
            </h2>
            <Button
              type="button"
              onClick={addQuestion}
              variant="outline"
              size="sm"
            >
              <Plus className="mr-1 size-4" />
              Add Question
            </Button>
          </div>

          {questions.map((q, qIndex) => (
            <div
              key={qIndex}
              className="space-y-3 rounded-lg border border-[#0a2463]/10 bg-white/40 p-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-[#0a2463]">
                  Question {qIndex + 1}
                </span>
                {questions.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeQuestion(qIndex)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <Label>Question Text</Label>
                <Input
                  value={q.question_text}
                  onChange={(e) =>
                    updateQuestion(qIndex, "question_text", e.target.value)
                  }
                  placeholder="What is the main argument of the essay?"
                  required
                />
              </div>

              <div className="space-y-3">
                {(["A", "B", "C", "D"] as const).map((letter, oIndex) => (
                  <div key={letter} className="space-y-1">
                    <Label className="text-xs">Option {letter}</Label>
                    <Input
                      value={q.options[oIndex]}
                      onChange={(e) =>
                        updateOption(qIndex, oIndex, e.target.value)
                      }
                      placeholder={`Option ${letter}`}
                      required
                    />
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Label>Correct Answer</Label>
                <div className="flex gap-2">
                  {(["A", "B", "C", "D"] as const).map((letter, oIndex) => (
                    <button
                      key={letter}
                      type="button"
                      onClick={() =>
                        updateQuestion(qIndex, "correct_index", oIndex)
                      }
                      className={`flex size-9 items-center justify-center rounded-md border text-sm font-medium transition-colors ${
                        q.correct_index === oIndex
                          ? "border-[#0a2463] bg-[#0a2463] text-white"
                          : "border-input hover:bg-[#0a2463]/5"
                      }`}
                    >
                      {letter}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </section>

        {error && (
          <p className="rounded-md bg-red-50 px-4 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-[#0a2463] text-white hover:bg-[#0a2463]/90"
          size="lg"
        >
          {loading ? "Creating..." : "Create Round"}
        </Button>
      </form>
    </div>
  );
}
