## 2024-05-23 - Skeleton Loader & Layout Shift
**Learning:** Moving static headers outside conditional rendering blocks significantly reduces Cumulative Layout Shift (CLS) and improves perceived performance, especially when combined with a skeleton loader.
**Action:** When implementing loading states, always identify static elements (titles, navigation) and hoist them above the loading conditional. Use skeleton loaders that mimic the final grid/list structure instead of generic spinners.
