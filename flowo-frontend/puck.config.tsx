import { Config, DropZone } from "@measured/puck";

type Props = {
  HeadingBlock: { title: string };
  Grid: {
    col: number;
    row: number;
  }; 
  Card: {
    title: string;
    description: string;
    padding: number;
    //Table 
    rowSpan: number;
    colSpan: number;
    //Border
    borderStyle: string;
    borderWidth: number;
    borderColor: string;
    borderRadius: number;
  };
};

export const config: Config<Props> = {
  components: {
    HeadingBlock: {
      fields: {
        title: { type: "text" },
      },
      defaultProps: {
        title: "Heading",
      },
      render: ({ title }) => (
        <div className="text-4xl font-bold p-8">
          <h1>{title}</h1>
        </div>
      ),
    },
    Grid: {
      fields: {
        col: { type: "number", min: 1, max: 10},
        row: { type: "number", min: 1, max: 10},
      },
      defaultProps: {
        col: 1,
        row: 1,
      },
      render: ({col, row}) => {
        return (
          <DropZone
            zone="grid-zone"
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${col || 1}, 1fr)`,
              gridTemplateRows: `repeat(${row || 1}, auto)`,
            }}
            allow={["GridItem"]}
          />
        );
      },
    },
    Card: {
      inline: true,
      fields: {
        title: { type: "text" },
        description: { type: "textarea" },
        padding: { type: "number", min: 4, max: 64 },
        rowSpan: { type: "number", min: 1 },
        colSpan: { type: "number", min: 1 },
        borderStyle: { type: "text" },
        borderWidth: { type: "number", min: 1 },
        borderColor: { type: "text" },
        borderRadius: { type: "number", min: 0 },
      },
      defaultProps: {
        title: "Topic Title",
        description: "Topic description...",
        padding: 16,
        rowSpan: 1,
        colSpan: 1,
        borderWidth: 1,
        borderStyle: "solid",
        borderColor: "#000000",
        borderRadius: 0,
      },
      render: ({ title, description, padding, rowSpan, colSpan, puck, borderStyle, borderWidth, borderColor, borderRadius }) => {
        return (
          <article  ref={puck.dragRef} 
            style={{ padding, 
            gridColumn: `span ${colSpan}`, 
            gridRow: `span ${rowSpan}`, 
            borderStyle: borderStyle,
            borderWidth: borderWidth,
            borderColor: borderColor,
            borderRadius: borderRadius,
          }
          }   
          className={`
            
          `}
            >
              <h2>{title}</h2>
              <p>{description}</p>
          </article>
        );
      },
    },
  },
};

export default config;
