import { optimizeImage } from 'lib/optmizeImage'
import { truncateAddress } from 'lib/truncateText'
import { DateTime } from 'luxon'
import Link from 'next/link'
import { FC, useEffect, useState } from 'react'
import Image from 'next/image'
import { useMediaQuery } from '@react-hookz/web'
import LoadingIcon from 'components/LoadingIcon'
import {
  FiExternalLink,
  FiImage,
  FiRepeat,
  FiTrash2,
  FiXSquare,
} from 'react-icons/fi'
import useEnvChain from 'hooks/useEnvChain'
import FormatCrypto from 'components/FormatCrypto'
import { formatDollar } from 'lib/numbers'
import useCollectionActivity, { Activity } from 'hooks/useCollectionActivity'

type Props = {
  collectionActivity: ReturnType<typeof useCollectionActivity>
}

const CollectionActivityTable: FC<Props> = ({ collectionActivity }) => {
  const headings = ['Event', 'Item', 'Price', 'From', 'To', 'Time']
  const isMobile = useMediaQuery('only screen and (max-width : 730px)')

  const {
    activity: { data: activity, isValidating },
    ref,
  } = collectionActivity
  const noSales = !isValidating && activity.length === 0

  return (
    <>
      <table>
        {!isMobile && !noSales && (
          <thead>
            <tr className="text-left">
              {headings.map((name, i) => (
                <th
                  key={i}
                  className="reservoir-subtitle pt-8 pb-7 font-medium text-neutral-600 dark:text-neutral-300"
                >
                  {name}
                </th>
              ))}
            </tr>
          </thead>
        )}

        <tbody>
          {activity.map((sale) => {
            if (!sale) return null

            return <CollectionActivityTableRow key={sale?.txHash} sale={sale} />
          })}
          {noSales && (
            <div className="mt-20 mb-20 flex w-full flex-col justify-center">
              <img
                src="/magnifying-glass.svg"
                className="h-[59px]"
                alt="Magnifying Glass"
              />
              <div className="reservoir-h6 mt-4 mb-2 text-center dark:text-white">
                No activity yet
              </div>
              <div className="text-center text-xs font-light dark:text-white">
                There hasn&apos;t been any activity for this <br /> collection
                yet.
              </div>
            </div>
          )}
          <tr ref={ref}></tr>
        </tbody>
      </table>
      {isValidating && (
        <div className="my-20 flex justify-center">
          <LoadingIcon />
        </div>
      )}
    </>
  )
}

type CollectionActivityTableRowProps = {
  sale: Activity[0]
}

const CollectionActivityTableRow: FC<CollectionActivityTableRowProps> = ({
  sale,
}) => {
  const isMobile = useMediaQuery('only screen and (max-width : 730px)')
  const [toShortAddress, setToShortAddress] = useState(sale?.toAddress || '')
  const [fromShortAddress, setFromShortAddress] = useState(
    sale?.fromAddress || ''
  )
  const [imageSrc, setImageSrc] = useState(
    sale?.token?.tokenImage || sale?.collection?.collectionImage || ''
  )
  const [timeAgo, setTimeAgo] = useState(sale?.timestamp || '')
  const envChain = useEnvChain()
  const etherscanBaseUrl =
    envChain?.blockExplorers?.etherscan?.url || 'https://etherscan.io'

  useEffect(() => {
    setToShortAddress(truncateAddress(sale?.toAddress || ''))
    setFromShortAddress(truncateAddress(sale?.fromAddress || ''))
    setTimeAgo(
      sale?.timestamp
        ? DateTime.fromSeconds(sale.timestamp).toRelative() || ''
        : ''
    )
  }, [sale])

  useEffect(() => {
    if (sale?.token?.tokenImage) {
      setImageSrc(optimizeImage(sale?.token?.tokenImage, 48))
    } else if (sale?.collection?.collectionImage) {
      setImageSrc(optimizeImage(sale?.collection?.collectionImage, 48))
    }
  }, [sale])

  if (!sale) {
    return null
  }

  let saleDescription = 'Sale'

  const logos = {
    transfer: <FiRepeat className="mr-[10px] h-[20px] w-[20px]" />,
    mint: <FiImage className="mr-[10px] h-[20px] w-[20px]" />,
    burned: <FiTrash2 className="mr-[10px] h-[20px] w-[20px]" />,
    listing_canceled: <FiXSquare className="mr-[10px] h-[20px] w-[20px]" />,
    offer_canceled: <FiXSquare className="mr-[10px] h-[20px] w-[20px]" />,
    ask: null,
    bid: null,
  }

  switch (sale?.type) {
    case 'mint': {
      saleDescription = 'Mint'
      break
    }
    case 'ask': {
      saleDescription = 'Sale'
      break
    }
    case 'bid': {
      saleDescription = 'Offer Accepted'
      break
    }
  }

  if (isMobile) {
    return (
      <tr
        key={sale.txHash}
        className="h-24 border-b border-gray-300 dark:border-[#525252]"
      >
        <td className="flex flex-col gap-2">
          <div className="mt-6">
            {/* @ts-ignore */}
            {sale.type && logos[sale.type]}
            {!!sale.source?.icon && (
              <img
                className="mr-2 inline h-6 w-6"
                // @ts-ignore
                src={sale.source?.icon || ''}
                alt={`${sale.source?.name} Source`}
              />
            )}
            <span className="text-sm text-neutral-600 dark:text-neutral-300">
              {saleDescription}
            </span>
          </div>
          <Link
            href={`/${sale?.collection?.collectionId}/${sale.token?.tokenId}`}
            passHref
          >
            <a className="flex items-center">
              <Image
                className="rounded object-cover"
                loader={({ src }) => src}
                src={imageSrc}
                alt={`${sale.token?.tokenName} Token Image`}
                width={48}
                height={48}
              />
              <div className="grid">
                <div className="reservoir-h6 ml-2 truncate dark:text-white">
                  {sale.token?.tokenName || `#${sale.token?.tokenId}`}
                </div>
                <div>{sale.collection?.collectionName}</div>
              </div>
            </a>
          </Link>
          <div>
            <span className="mr-1 font-light text-neutral-600 dark:text-neutral-300">
              From
            </span>
            <Link href={`/address/${sale.fromAddress}`}>
              <a className="font-light text-primary-700 dark:text-primary-300">
                {fromShortAddress}
              </a>
            </Link>
            <span className="mx-1 font-light text-neutral-600 dark:text-neutral-300">
              to
            </span>
            <Link href={`/address/${sale.toAddress}`}>
              <a className="font-light text-primary-700 dark:text-primary-300">
                {toShortAddress}
              </a>
            </Link>
            <Link href={`${etherscanBaseUrl}/tx/${sale.txHash}`}>
              <a
                target="_blank"
                rel="noopener noreferrer"
                className="mb-4 flex items-center gap-2 font-light text-neutral-600 dark:text-neutral-300"
              >
                {timeAgo}
                <FiExternalLink className="h-4 w-4" />
              </a>
            </Link>
          </div>
        </td>
        <td>
          <FormatCrypto amount={sale.price} />
          {/* {sale.price?.amount?.usd && (
            <div className="text-xs text-neutral-600">
              {formatDollar(sale.price?.amount?.usd)}
            </div>
          )} */}
        </td>
      </tr>
    )
  }

  return (
    <tr
      key={sale.txHash}
      className="h-24 border-b border-gray-300 dark:border-[#525252]"
    >
      <td>
        <div className="mr-2.5 flex items-center">
          {/* @ts-ignore */}
          {sale.type && logos[sale.type]}
          {!!sale.source?.icon && (
            <img
              className="mr-2 h-6 w-6"
              // @ts-ignore
              src={sale.source?.icon || ''}
              alt={`${sale.source?.name} Source`}
            />
          )}
          <span className="text-sm text-neutral-600 dark:text-neutral-300">
            {saleDescription}
          </span>
        </div>
      </td>
      <td>
        <Link
          href={`/${sale.collection?.collectionId}/${sale.token?.tokenId}`}
          passHref
        >
          <a className="mr-2.5 flex items-center">
            <Image
              className="rounded object-cover"
              loader={({ src }) => src}
              src={imageSrc}
              alt={`${sale.token?.tokenName} Token Image`}
              width={48}
              height={48}
            />
            <div className="ml-2 grid truncate">
              <div className="reservoir-h6 dark:text-white">
                {sale.token?.tokenName || `#${sale.token?.tokenId}`}
              </div>
              <div className="reservoir-small dark:text-white">
                {sale.collection?.collectionName}
              </div>
            </div>
          </a>
        </Link>
      </td>
      <td>
        <FormatCrypto amount={sale.price} />
        {/* {sale.price?.amount?.usd && (
          <div className="text-xs text-neutral-600">
            {formatDollar(sale.price?.amount?.usd)}
          </div>
        )} */}
      </td>
      <td>
        <Link href={`/address/${sale.fromAddress}`}>
          <a className="ml-2.5 mr-2.5 font-light text-primary-700 dark:text-primary-300">
            {fromShortAddress}
          </a>
        </Link>
      </td>
      <td>
        <Link href={`/address/${sale.toAddress}`}>
          <a className="mr-2.5 font-light text-primary-700 dark:text-primary-300">
            {toShortAddress}
          </a>
        </Link>
      </td>
      <td>
        <Link href={`${etherscanBaseUrl}/tx/${sale.txHash}`}>
          <a
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 whitespace-nowrap font-light text-neutral-600 dark:text-neutral-300"
          >
            {timeAgo}
            <FiExternalLink className="h-4 w-4" />
          </a>
        </Link>
      </td>
    </tr>
  )
}

export default CollectionActivityTable
