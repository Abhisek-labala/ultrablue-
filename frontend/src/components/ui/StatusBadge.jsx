import React from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  ShieldCheck, 
  Package, 
  Sparkles,
  Info
} from 'lucide-react';

export const StatusBadge = ({ status, label, showIcon = true, className = '' }) => {
  let badgeType = 'neutral';
  let displayLabel = label || status;
  let IconComponent = null;

  switch (status) {
    case 'HEALTHY':
    case 'APPROVED':
    case 'ACTIVE':
    case 'PAID':
    case 'COMPLETED':
      badgeType = 'success';
      IconComponent = CheckCircle2;
      displayLabel = label || (status === 'HEALTHY' ? 'In Stock (Healthy)' : status === 'PAID' ? 'Paid' : 'Approved');
      break;

    case 'LOW_STOCK':
    case 'PENDING_REVIEW':
    case 'PENDING':
    case 'IN_PROGRESS':
      badgeType = 'warning';
      IconComponent = AlertTriangle;
      displayLabel = label || (status === 'LOW_STOCK' ? 'Low Stock Alert' : status === 'PENDING_REVIEW' ? 'Pending KYC' : 'Pending');
      break;

    case 'OUT_OF_STOCK':
    case 'REJECTED':
    case 'EXPIRED':
    case 'CANCELLED':
      badgeType = 'danger';
      IconComponent = XCircle;
      displayLabel = label || (status === 'OUT_OF_STOCK' ? 'Out of Stock' : status === 'EXPIRED' ? 'Batch Expired' : 'Rejected');
      break;

    case 'NEW_INQUIRY':
    case 'INFO':
    case 'PROCESSING':
      badgeType = 'info';
      IconComponent = Info;
      displayLabel = label || 'New Inquiry';
      break;

    case 'GOLD_TIER':
    case 'PLATINUM_TIER':
    case 'PREMIUM':
      badgeType = 'gold';
      IconComponent = Sparkles;
      displayLabel = label || 'Premium Tier';
      break;

    default:
      badgeType = 'neutral';
      IconComponent = Package;
      displayLabel = label || status;
      break;
  }

  return (
    <span className={`ub-badge ub-badge-${badgeType} ${className}`}>
      <span className="ub-badge-dot" />
      {showIcon && IconComponent && <IconComponent size={12} />}
      <span>{displayLabel}</span>
    </span>
  );
};
