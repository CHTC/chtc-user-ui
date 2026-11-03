import type { MembershipPath, MembershipPathNames } from "@/types";
import { Chip, Stack, Tooltip } from "@mui/material";
import Link from "next/link";

interface MembershipPathsProps {
  direct: boolean;
  paths: MembershipPath[];
  path_names: MembershipPathNames[];
  /** Links each group name along a path to its page; off for readers who cannot open groups */
  linkGroups?: boolean;
}

/**
 * The "how does this user have access" column of every members table: "Direct" when the
 * user was added to the group itself, otherwise one chip per path through other groups.
 * Paths start at the group being viewed, so that first hop is dropped from the label.
 */
export const MembershipPaths = ({ direct, paths, path_names, linkGroups = true }: MembershipPathsProps) => {
  const indirect = paths
    .map((path, i) => ({ ids: path.slice(1), names: path_names[i]?.slice(1) ?? [] }))
    .filter(({ ids }) => ids.length > 0);

  return (
    <Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap">
      {direct && <Chip size="small" color="primary" label="Direct" />}
      {indirect.map(({ ids, names }) => {
        const label = names.join(" › ");
        const last = ids[ids.length - 1];
        return (
          <Tooltip key={ids.join("-")} title={`Member through ${label}`}>
            {linkGroups ? (
              <Chip size="small" variant="outlined" label={label} component={Link} href={`/groups/edit/?id=${last}`} clickable />
            ) : (
              <Chip size="small" variant="outlined" label={label} />
            )}
          </Tooltip>
        );
      })}
    </Stack>
  );
};

export default MembershipPaths;
