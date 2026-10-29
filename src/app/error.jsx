"use client";

import ErrorPage from "@/components/error/ErrorPage";

export default function Error({retry }) {

  return <ErrorPage onReload={retry} />;
}
