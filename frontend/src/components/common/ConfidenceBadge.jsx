const classes = {
  high: 'badge-high',
  medium: 'badge-medium',
  low: 'badge-low',
};

const labels = {
  high: 'Alta',
  medium: 'Media',
  low: 'Baja',
};

export default function ConfidenceBadge({ level }) {
  return <span className={classes[level] || classes.medium}>{labels[level] || level}</span>;
}
