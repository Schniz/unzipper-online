import { GetServerSideProps } from "next";
import { File, listFilesInZip } from "../src/unzip";
import {validateUrl} from "../src/validateUrl";

type Props =
  | {
      state: "listFiles";
      archive: string;
      files: File[];
    }
  | {
      state: "home";
    };

export default function Home(props: Props): NonNullable<React.ReactNode> {
  switch (props.state) {
    case "home": {
      return <div>Hello, world! {JSON.stringify(props)}</div>;
    }
    case "listFiles": {
      return (
        <div>
          <h1>
            Files in <code>{props.archive}</code>
          </h1>
          <ul>
            {props.files
              .filter((f) => f.type === "File")
              .map((file) => {
                const path = encodeURIComponent(file.fileName);
                const archive = encodeURIComponent(props.archive);
                return (
                  <li key={file.fileName}>
                    <a href={`/api/unzip?path=${path}&archive=${archive}`}>
                      <code>{file.fileName}</code>
                    </a>
                  </li>
                );
              })}
          </ul>
        </div>
      );
    }
  }
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const { archive } = ctx.query;

  if (archive) {
    if (typeof archive !== "string") {
      throw new Error("archive must be a string");
    }

    validateUrl(archive);
    ctx.res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
    const files = await listFilesInZip(archive);

    return {
      props: {
        state: "listFiles",
        archive,
        files,
      },
    };
  }

  return {
    props: {
      state: "home",
    },
  };
};
