package com.shopjoy.ecadminapi.base.ec.st.repository.qrydsl;

import com.shopjoy.ecadminapi.common.data.BasePage;
import com.shopjoy.ecadminapi.base.ec.st.data.dto.StSettleAdjDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettleAdj;

import java.util.List;
import java.util.Optional;

/** StSettleAdj QueryDSL Custom Repository */
public interface QStSettleAdjRepository {

    /** 단건 조회 */
    Optional<StSettleAdjDto.Item> selectById(String id);

    /** 전체 목록 (page/size 가 양수면 페이징 적용) */
    List<StSettleAdjDto.Item> selectList(StSettleAdjDto.Request search);

    /** 페이지 목록 (pageNo/pageSize 미지정 시 1페이지/10건 기본) */
    BasePage<StSettleAdjDto.Item> selectPageData(StSettleAdjDto.Request search);

    int updateSelective(StSettleAdj entity);

    /** 정산ID 기준 승인된 조정항목(aprvStatusCd=APPROVED, 관리 엔티티 그대로 반환).
     *  base 의 findApprovedBySettleId 대체 (2026-08-27) */
    List<StSettleAdj> selectApprovedBySettleId(String settleId);
}
