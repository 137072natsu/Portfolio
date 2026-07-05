import React from "react";

import fs from "fs";
import path from "path";
import ReactMarkdown from "react-markdown";
import Box from "@mui/material/Box";

export default function DocumentationPage() {
  const filePath = path.join(
    process.cwd(),
    "app",
    "documentation",
    "README.md"
  );

  const markdown = fs.readFileSync(filePath, "utf-8");

  return (
    <Box
      sx={{
        maxWidth: "800px",
        mx: "auto",
        mt: 4,
        px: 2,

        "& h1": {
          fontSize: "2rem",
          fontWeight: "bold",
          mt: 4,
          mb: 2,
        },
        "& h2": {
          fontSize: "1.5rem",
          fontWeight: "bold",
          mt: 3,
          mb: 1.5,
        },
        "& h3": {
          fontSize: "1.25rem",
          fontWeight: "bold",
          mt: 2,
          mb: 1,
        },
        "& p": {
          lineHeight: 1.8,
          mb: 2,
        },
        "& ul": {
          pl: 4,
          mb: 2,
          listStyleType: "disc",
        },
        "& ol": {
          pl: 4,
          mb: 2,
          listStyleType: "decimal",
        },
        "& li": {
          mb: 0.5,
        },
        "& code": {
          bgcolor: "#f5f5f5",
          px: 0.5,
          py: 0.2,
          borderRadius: 1,
        },
        "& pre": {
          bgcolor: "#f5f5f5",
          p: 2,
          borderRadius: 2,
          overflowX: "auto",
        },
      }}
    >
      <ReactMarkdown>{markdown}</ReactMarkdown>
    </Box>
  );
}