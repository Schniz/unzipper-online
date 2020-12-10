import { GetServerSideProps } from "next";
import { File, listFilesInZip } from "../src/unzip";
import { unzip } from "../src/zip";
import { validateUrl } from "../src/validateUrl";
import { useRef, useState, useEffect, ChangeEvent } from "react";
import { useRouter } from "next/router";
import DocumentIcon from "heroicons/react/solid/Document";
import DocumentIconOutline from "heroicons/react/outline/Document";
import Head from "next/head";
import { AxiosError } from "axios";

type PageState =
  | {
      state: "errorReading";
      message: string;
      archive: string;
    }
  | {
      state: "listFiles";
      archive: string;
      files: File[];
    }
  | {
      state: "home";
    };

export default function Home(props: PageState): NonNullable<React.ReactNode> {
  const textInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [pageState, setPageState] = useState<PageState>(props);
  useEffect(() => {
    setPageState(props);
  }, [props]);
  const userSelectedFile = async (a: ChangeEvent<HTMLInputElement>) => {
    try {
      const zip = await unzip(a.target.files?.[0]);
      setPageState({
        state: "listFiles",
        archive: zip.name,
        files: zip.files.map((e) => ({
          type: e.dir ? "Directory" : "File",
          fileName: e.name,
        })),
      });
    } catch (err) {
      setPageState({
        state: "errorReading",
        archive: a.target.files?.[0].name ?? "unknown",
        message: err.message,
      });
    }
  };

  return (
    <>
      <Head>
        <title>
          The Unzipper
          {pageState.state === "listFiles" ? " : file list" : null}
          {pageState.state === "errorReading" ? " : an error occured" : null}
        </title>
      </Head>
      <div className="min-h-screen min-w-screen">
        <form
          className="p-4 bg-red-100 grid grid-cols-9 gap-4"
          action="/"
          onSubmit={(e) => {
            e.preventDefault();
            if (!textInputRef.current) return;
            const archive = encodeURIComponent(
              textInputRef.current.value.trim()
            );
            router.push(`/?archive=${archive}`);
          }}
        >
          <h1 className="pb-4 font-bold tracking-wider uppercase col-span-9">
            The Unzipper
          </h1>
          <input
            className="min-w-full p-4 rounded col-span-8"
            name="webArchive"
            ref={textInputRef}
            type="url"
            defaultValue={
              pageState.state === "listFiles"
                ? pageState.archive
                : pageState.state === "errorReading"
                ? pageState.archive
                : ""
            }
            placeholder="https://example.com/file.zip"
          />
          <label
            htmlFor="clientArchive"
            className="flex justify-center items-center col-span-1"
          >
            Browse...
          </label>
          <input
            className="hidden"
            type="file"
            id="clientArchive"
            name="clientArchive"
            onChange={userSelectedFile}
          />
        </form>
        <div className="p-4">
          {pageState.state === "errorReading" && (
            <>
              <h3 className="text-xl font-thin">An error occured</h3>
              <p>{pageState.message}</p>
            </>
          )}
          {pageState.state === "listFiles" && (
            <>
              <h3 className="text-xl font-thin">
                Files in{" "}
                <code className="inline-block p-1 text-sm leading-normal align-middle bg-red-100 rounded">
                  {pageState.archive}
                </code>
              </h3>
              <ul className="pt-4 grid lg:grid-cols-3 md:grid-cols-2 sm:grid-cols-1">
                {pageState.files
                  .filter((f) => f.type === "File")
                  .map((file) => {
                    const path = encodeURIComponent(file.fileName);
                    const archive = encodeURIComponent(pageState.archive);
                    return (
                      <li key={file.fileName}>
                        <a
                          className="flex items-center p-2 group"
                          href={`/api/unzip?path=${path}&archive=${archive}`}
                        >
                          <DocumentIcon className="flex-none hidden inline w-6 h-6 group-hover:inline" />
                          <DocumentIconOutline className="flex-none inline w-6 h-6 group-hover:hidden" />
                          <code className="flex-1 pl-1 break-all">
                            {file.fileName}
                          </code>
                        </a>
                      </li>
                    );
                  })}
              </ul>
            </>
          )}
        </div>
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<PageState> = async (
  ctx
) => {
  const { archive } = ctx.query;

  if (archive) {
    if (typeof archive !== "string") {
      throw new Error("archive must be a string");
    }

    validateUrl(archive);
    try {
      const files = await listFilesInZip(archive);
      ctx.res.setHeader(
        "Cache-Control",
        "s-maxage=3600, stale-while-revalidate"
      );

      return {
        props: {
          state: "listFiles",
          archive,
          files,
        },
      };
    } catch (e) {
      ctx.res.statusCode = (e as AxiosError).response?.status ?? 500;
      return {
        props: {
          state: "errorReading",
          archive,
          message: e.message,
        },
      };
    }
  }

  return {
    props: {
      state: "home",
    },
  };
};
