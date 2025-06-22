"use client";

import type { Data } from "@measured/puck";
import { Puck } from "@measured/puck";
import conf from "../../config/server"

export function Client({ path, data }: { path: string; data: Partial<Data> }) {
  return (
    <Puck
      config={conf}
      data={data}
      onPublish={async (data) => {
        await fetch("/puck/api", {
          method: "post",
          body: JSON.stringify({ data, path }),
        });
      }}
    />
  );
}
