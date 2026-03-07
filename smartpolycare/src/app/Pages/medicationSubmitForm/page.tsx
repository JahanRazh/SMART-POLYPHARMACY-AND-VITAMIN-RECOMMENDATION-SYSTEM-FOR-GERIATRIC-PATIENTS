"use client";

import { useState , FormEvent } from "react";

export default function ThreeInputForm() {
  const [search1 , setSearch1] = useState<string>("");
  const [search2 , setSearch2] = useState<string>("");
  const [text, setText] = useState<string>("");

  const dataList1: string[] = ["Penadol", "Piriton", "amoxylin", "Augmentin"];
  const dataList2: string[] = ["Penadol", "Piriton", "amoxylin", "Augmentin"];

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log({ search1, search2, text });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-2xl shadow-md w-full max-w-md space-y-4"
      >
        <h2 className="text-xl font-semibold text-center">Symmptom and medication Form</h2>

        {/* Search Input 1 */}
        <div className="flex flex-col">
          <label className="mb-1 font-medium">Enter first medicine</label>
          <input
            list="options1"
            value={search1}
            onChange={(e) => setSearch1(e.target.value)}
            className="border rounded-lg p-2"
            placeholder="Search from given texts"
          />
          <datalist id="options1">
            {dataList1.map((item, index) => (
              <option key={index} value={item} />
            ))}
          </datalist>
        </div>

        {/* Search Input 2 */}
        <div className="flex flex-col">
          <label className="mb-1 font-medium">Enter second medicine</label>
          <input
            list="options2"
            value={search2}
            onChange={(e) => setSearch2(e.target.value)}
            className="border rounded-lg p-2"
            placeholder="Search from given texts"
          />
          <datalist id="options2">
            {dataList2.map((item, index) => (
              <option key={index} value={item} />
            ))}
          </datalist>
        </div>

        {/* Free Text Input */}
        <div className="flex flex-col">
          <label className="mb-1 font-medium">Type your symptoms here</label>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="border rounded-lg p-2"
            placeholder="Type anything"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg"
        >
          Submit
        </button>
      </form>
    </div>
  );
}
