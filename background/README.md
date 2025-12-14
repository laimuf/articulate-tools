## Modify background after Publish


Add the `Custom Background Color` section after exporting Rise360 course.

```html
<!DOCTYPE html>
<html lang="en" class="">
  <head>
    <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta charset="utf-8">

    <title>Understanding Browser-in-the-Browser (BitB) Attack</title>
    <link type="text/css" rel="stylesheet" href="lib/icomoon.css">
    <script type="text/javascript" src="lib/player-0.0.11.min.js"></script>
    <script type="text/javascript" src="lib/lzwcompress.js"></script>

    <!-- Custom Background Color 1. save this 2. ask to modify might thml block frame 3. only target top part first section with the green /* Target block containers and frames */-->
    
    <style>
        body {
            /* This is the master background for the whole window */
            background-color: #cae219 !important; 
        }

        .page,
        .course-lesson__content,
        .course-content,
        .blocks-lesson {
            /* These cover the main containers and content frame */
            background-color: #d25d15 !important; 
        }

        /* Target block containers and frames */
        .block,
        .rise-block,
        .block-wrapper,
        .course-block,
        [data-block-id],
        .lesson-block {
            background-color: #128c2f !important;
        }

        /* Target card/box containers */
        .card,
        .block-card,
        .rise-card,
        .card-wrapper {
            background-color: #fbfbfb !important;
        }

        /* Target spacing and dividers */
        .block-spacing,
        .block-divider,
        .spacing-block,
        .divider {
            background-color: #d5db1d !important;
        }

        /* Target wrapper elements */
        .wrapper,
        .container,
        .content-wrapper,
        .blocks-wrapper {
            background-color: #1ac3cc !important;
        }

        /* Target any white backgrounds that might appear */
        [style*="background-color: rgb(255, 255, 255)"],
        [style*="background-color: #fff"],
        [style*="background-color: #ffffff"] {
            background-color: #3312c4 !important;
        }
    </style>
```


Added to raise css might
```
[data-block-id="cmixk40vg00003bcs8125be09"] .mty-border-container {
    /* Set the color */
    /* background-color: #ff0000 !important; */
    /* Eliminate external spacing */
    margin: 0 !important;
    padding: 0 !important;
}
```


### Mighty Html Block


For Mighty block, set max expansion + add background for extra lines:
```html
.block,
.rise-block,
.block-wrapper,
.course-block,
[data-block-id="cmj5rqo9700003be089qfol1p"],
.lesson-block {
    background-color: #128c2f !important;
}
```