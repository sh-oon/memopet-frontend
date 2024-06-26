import { type FormEvent, useMemo, useState } from 'react'
import checkEmailType from '@/app/utils/checkEmail'
import checkContactNumber from '@/app/utils/checkContactNumber'
import type { ValidateObj, ChangeEvt } from '@/app/types/common'
import postAuthCode from '@/app/api/email/postAuthCode'
import checkDuplicateEmail from '@/app/api/email/checkDuplicateEmail'
import ValidationInput from '../input/validationInput'
import CheckBtn from '../button/checkBtn'
import api from '@/app/api/axios'
import MainBtn from '../button/mainBtn'
import { initValidateObj } from '@/app/constants/login'
import checkName from '@/app/utils/checkName'
import checkAuthCode from '@/app/api/email/checkAuthCode'
import checkPassword from '@/app/utils/checkPassword'

const AgreeTerms = () => {
  return (
    <span><a className='underline'>이용약관</a> 및 <a className='underline'>개인정보 보호정책</a>에 동의합니다.</span>
  )
}

interface Validate {
  email: ValidateObj;
  authCode: ValidateObj;
  password: ValidateObj;
  checkPassword: ValidateObj;
  name: ValidateObj;
  contact: ValidateObj;
  agree: ValidateObj;
}

type ValidateKey = keyof typeof initValidate;

interface JoinResponse {
  username: string;
  user_status: string;
  user_role: string;
  login_fail_count: number;
  access_token_expiry: number;
  token: string;
}

const initValidate = {
  email: initValidateObj,
  authCode: initValidateObj,
  password: initValidateObj,
  checkPassword: initValidateObj,
  name: initValidateObj,
  contact: initValidateObj,
  agree: initValidateObj,
} as const

const initJoinForm = {
  email: '',
  authCode: '',
  password: '',
  checkPassword: '',
  name: '',
  contact: '',
  id: null,
  agree: false,
}

const passwordPlaceholder = '영문, 숫자, 특수문자 혼합 8자 이상 입력'

const JoinForm = () => {
  const [checkEmail, setCheckEmail] = useState<number | null>(null)
  const [joinForm, setJoinForm] = useState(initJoinForm)
  const [validate, setValidate] = useState<Validate>({ ...initValidate })

  // FIXME: 중복코드
  // 유효성 검사 초기화 && 성공
  function initializeValidate(key: ValidateKey) {
    setValidate((prev) => ({ ...prev, [key]: initValidateObj }))
  }

  // 유효성 검사 실패
  function failValidate(key: ValidateKey, msg: string) {
    setValidate((prev) => ({ ...prev, [key]: { msg: msg, status: false } }))
  }

  // 유효성 검사 성공
  function successValidate(key: ValidateKey, msg = '') {
    setValidate((prev) => ({ ...prev, [key]: { msg, status: true } }))
  }

  // 이메일, 인증코드 초기화
  function retryAuthEmail(emailValue = '') {
    setJoinForm({ ...joinForm, email: emailValue, authCode: '' })
    setCheckEmail(null)
    initializeValidate('email')
    initializeValidate('authCode')
  }


  const buttonLabel = useMemo(() =>
    !!joinForm.email && !!validate.email.status && !!joinForm.authCode && !!validate.authCode.status
      ? '이메일 변경'
      : !!joinForm.email && validate.email.status ? '다시 요청' : '인증 요청',
    [joinForm.email, joinForm.authCode, validate.email.status, validate.authCode.status])

  const inputs = [
    {
      label: '이메일',
      validate: validate.email,
      placeholder: 'sample@email.com',
      type: 'email',
      value: joinForm.email,
      name: 'email',
      hideButton: buttonLabel === '이메일 변경',
      disable: buttonLabel === '이메일 변경',
      onChange: (value: ChangeEvt) => {
        retryAuthEmail(value)
      },
    },
    {
      label: '입력하신 이메일로 인증코드를 보냈어요!',
      validate: validate.authCode,
      placeholder: 'ABC123',
      type: 'text',
      value: joinForm.authCode,
      name: 'authCode',
      hideButton: buttonLabel === '이메일 변경',
      disable: buttonLabel === '이메일 변경',
      labelClass: '-mt-3 font-normal !text-[13px] !text-gray07',
      hide: !!checkEmail,
      onChange: (value: ChangeEvt) => {
        setJoinForm({ ...joinForm, authCode: value })
        initializeValidate('authCode')
      },
    },
    {
      label: '비밀번호',
      validate: validate.password,
      placeholder: passwordPlaceholder,
      type: 'password',
      value: joinForm.password,
      name: 'password',
      onChange: (value: ChangeEvt) => {
        setJoinForm({ ...joinForm, password: value })
        initializeValidate('password')
      },
      onBlur: () => {
        if (checkPassword(joinForm.password)) {
          failValidate('password', '영문, 숫자, 특수문자 혼합하여 8자 이상으로 설정해야 합니다.')
          return
        }

        successValidate('password')
      }
    },
    {
      label: '비밀번호 확인',
      validate: validate.checkPassword,
      placeholder: passwordPlaceholder,
      type: 'password',
      value: joinForm.checkPassword,
      name: 'checkPassword',
      onChange: (value: ChangeEvt) => {
        setJoinForm({ ...joinForm, checkPassword: value })
        initializeValidate('checkPassword')
      },
      onBlur: () => {
        const condition = joinForm.password !== joinForm.checkPassword

        if (!condition) {
          successValidate('checkPassword')
          return
        }

        failValidate('checkPassword', '비밀번호가 일치하지 않습니다.')
      }
    },
    {
      label: '이름',
      validate: validate.name,
      placeholder: '이름 입력',
      type: 'text',
      value: joinForm.name,
      name: 'name',
      onChange: (value: ChangeEvt) => {
        setJoinForm({ ...joinForm, name: value })
        initializeValidate('name')
      },
      onBlur: () => {
        if (checkName(joinForm.name)) {
          failValidate('name', '한글만 입력해주세요. (영문, 특수기호 입력 불가)')
          return
        }
        
        successValidate('name')
      }
    },
    {
      label: '휴대폰번호',
      validate: validate.contact,
      placeholder: '‘-’ 없이 숫자만 입력',
      type: 'tel',
      value: joinForm.contact,
      name: 'contact',
      description: '*내 계정을 찾을 때 필요해요',
      onChange: (value: ChangeEvt) => {
        setJoinForm({ ...joinForm, contact: value })
        initializeValidate('contact')
      },
      onBlur: () => {
        if (checkContactNumber(joinForm.contact)) {
          failValidate('contact', '숫자만 입력해주세요.')
          return
        }
        
        successValidate('contact')
      }
    },
  ]

  // 이메일 인증코드 요청
  async function checkAuthEmail() {
    if (checkEmailType(joinForm.email)) { 
      failValidate('email', '이메일을 정확히 입력해주세요.')
      return
    }

    // 다시 요청
    if (!!joinForm.email && validate.email.status) {
      setJoinForm({ ...joinForm, authCode: '' })
      initializeValidate('authCode')
    }

    checkDuplicateEmail(joinForm.email, setValidate).then((res) => {
      if (!res) return
      postAuthCode<Validate>(joinForm.email, setValidate).then((res) => {
        if (res.authCode) {
          setCheckEmail(res.verificationStatusId)
        }
      })
    })
  }

  // 이용약관 동의
  function handleAgreeCheckbox(val: boolean) {
    setJoinForm({ ...joinForm, agree: val })

    if (val) {
      successValidate('agree')
      return
    }

    failValidate('agree', '')
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()

    try {
      const res = await api.post<JoinResponse>('sign-up', {
        email: joinForm.email,
        password: joinForm.password,
        username: joinForm.name,
        phoneNum: joinForm.contact,
      })

      if (res.data.token) {
        // setCookie(res.data.token, res.data.access_token_expiry)
        // TODO: 쿠키에 사용자 정보 세팅
      }
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <form className='flex flex-col gap-6' onSubmit={handleSubmit}>
      {inputs.map((input) => (
        <ValidationInput
          key={input.name}
          label={input.label}
          value={input.value}
          placeholder={input.placeholder}
          name={input.name}
          type={input.type}
          validate={input.validate}
          labelClass={input?.labelClass}
          hide={input?.hide}
          description={input?.description}
          onChange={input.onChange}
          onBlur={input?.onBlur}
          hideButton={input?.hideButton}
          disable={input?.disable}
        >
          {input.name === 'email' &&
            <button
              type='button'
              disabled={!input.value}
              className={`auth-button ${buttonLabel === '이메일 변경' && '!border !border-gray04 !bg-white !text-gray07'}`}
              onClick={() => buttonLabel === '이메일 변경' ? input.onChange('') : checkAuthEmail()}
            >{buttonLabel}
            </button>}
          {input.name === 'authCode' &&
            <button
              type='button'
              disabled={!input.value || buttonLabel === '이메일 변경'}
              className='auth-button'
              onClick={() => checkAuthCode<Validate>({ ...joinForm, id: checkEmail! }, setValidate)}
            >
              확인
            </button>
          }
        </ValidationInput>
      ))}
      <fieldset className='pb-2'>
        <CheckBtn
          name='agree'
          checked={joinForm.agree}
          children={<AgreeTerms />}
          onChange={handleAgreeCheckbox}
        />
      </fieldset>
      <MainBtn text='가입하기' disabled={Object.values(validate).some((val) => !val.status)} />
    </form>
  )
}

export default JoinForm
