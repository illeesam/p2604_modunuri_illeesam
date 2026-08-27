package com.shopjoy.ecadminapi.base.sy.repository.qrydsl;

import com.shopjoy.ecadminapi.common.data.BasePage;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyAttachDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyAttach;

import java.util.List;
import java.util.Optional;

/** SyAttach QueryDSL Custom Repository */
public interface QSyAttachRepository {
    Optional<SyAttachDto.Item> selectById(String attachId);

    /** N+1 방지 배치조회 — 관리 엔티티 그대로 반환(toBrief/toAttachFile/cleanupFiles 가 엔티티 시그니처 요구, DTO selectList 와 다른 반환타입).
     *  정렬: refId asc, sortOrd asc, attachId asc. base 의 findByRefTableNmAndRefIdInOrderByRefIdAscSortOrdAscAttachIdAsc 대체 */
    List<SyAttach> selectListByRefIds(String refTableNm, List<String> refIds);
    List<SyAttachDto.Item> selectList(SyAttachDto.Request search);
    BasePage<SyAttachDto.Item> selectPageData(SyAttachDto.Request search);
    int updateSelective(SyAttach entity);
}
