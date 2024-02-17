import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import crypto from 'crypto';
import User from "../models/userModel";
import catchAsyncErrors from "../modules/CatchAsyncErrors";
import createJWT from "../modules/createJWT";
import AppError from "../modules/appError";
import sendEmail from '../modules/email';

const comparePassword = (password, hash) => {
  return bcrypt.compare(password, hash)
}

export const createNewUser = catchAsyncErrors(async (req, res, next) => {
  const { firstName, lastName, email, password, passwordConfirm } = req.body;
  const newUser = await User.create({
    firstName,
    lastName,
    email,
    password,
    passwordConfirm,
  })

  res.status(200).json({
    messsage: "Account created, Please login"
  });
});

export const login = catchAsyncErrors(async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email }).select('+password');

  if (!user) {
    return next(new AppError("User does not exist", 401));
  }

  const isValid = await comparePassword(password, user.password)

  if (!isValid) {
    return next(new AppError("email or password is incorrect", 401))
  }

  const token = await createJWT(user);

  req.session.userId = user._id;

  const cookieData = JSON.stringify({ token, userId: user._id });
  res.cookie('sessionData', cookieData, {
    httpOnly: true,
    secure: true,
    maxAge: 3600000 // Example: cookie expires after 1 hour
  }).json({ message: 'Login successful' });

})


export const protectRoutes = catchAsyncErrors(async (req, res, next) => {

  if (!req.session) {
    return next(new AppError('Unauthorized: Session not found', 401));
  }

  const sessionData = req.cookies.sessionData;

  if (!sessionData) {
    return next(new AppError('Unauthorized: Session data not found', 401));
  }

  const decodedSessionData = decodeURIComponent(sessionData); // Decode the URL encoded session data
  const { token, userId } = JSON.parse(decodedSessionData);

  if (!token) {
    return next(new AppError('Unauthorized: Token not found in session data', 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as { id: string };

    if (decoded.id !== userId) {
      return next(new AppError('Unauthorized: Token does not match user ID', 401));
    }

    const user = await User.findById(decoded.id);

    if (!user) {
      return next(new AppError('Unauthorized: User not found', 401));
    }

    req.user = user;
    next();
  } catch (err) {
    return next(new AppError('Unauthorized: Invalid token', 401));
  }
});

export const logout = catchAsyncErrors(async (req, res, next) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
      return next(new AppError('Error destroying session', 500));
    }
    res.clearCookie('sessionData');
    res.status(200).json({ message: 'Logout successful' });
  });
});

export const forgotPassword = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with this email address', 404));
  }

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your Password? ${resetURL}`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Password Reset Token (valid for 10 minutes)',
      message,
    });

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new AppError('There was an error sending the email. Please try again.', 500));
  }
});

export const resetPassword = catchAsyncErrors(async (req, res, next) => {
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
  const user = await User.findOne({ passwordResetToken: hashedToken, passwordResetExpires: { $gt: Date.now() } });

  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400))
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined
  await user.save();

  res.status(200).json({
    message: 'Password reset successufully please login'
  })
})

export const updatePassword = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password');

  if (!(await comparePassword(req.body.passwordConfirm, user.password))) {
    return next(new AppError("Your current Password is wrong", 401));
  }

  user.password = req.body.password
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  res.status(200).json({
    message: 'Password updated successufully'
  })
})

export const restrictTO = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403))
    }

    next();
  }
}
