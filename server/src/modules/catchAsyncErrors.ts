const catchAsyncErrors = fn => {
  return (res, req, next) => {
    fn(res, req, next).catch(next)
  }
}

export default catchAsyncErrors