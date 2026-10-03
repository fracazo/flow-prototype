# Product name
> One line promise of the product.
device: iphone

## 1 | First flow
> One line summary of the job.

### 1.1 | Start
why: One sentence on why this beat exists.
screen: Placeholder until a real screen is written.
copy:
- title: Start
- body: Say what this step is for.
- primary: Continue
edges:
- happy -> 1.2

### 1.2 | Done
why: One sentence on why this beat exists.
screen: Placeholder until a real screen is written.
copy:
- title: Done
- body: Say what the person just finished.
- back: Back
end: true
edges:
- back -> 1.1
