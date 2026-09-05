package com.shopjoy.ecBeBo.base.sy.repository.qrydsl;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.sy.data.dto.SyNotiDto;
import com.shopjoy.ecBeBo.base.sy.data.entity.SyNoti;

import java.util.List;
import java.util.Optional;

/** SyNoti QueryDSL Custom Repository */
public interface QSyNotiRepository {
    Optional<SyNotiDto.Item> selectById(String notiId);
    List<SyNotiDto.Item> selectList(SyNotiDto.Request search);
    BasePage<SyNotiDto.Item> selectPageData(SyNotiDto.Request search);
    int updateSelective(SyNoti entity);
    /* 수신자 기준 일괄 처리 — 알림함 "모두읽음" / "전체삭제" */
    long countUnread(String recvTypeCd, String recvId);
    int  markAllRead(String recvTypeCd, String recvId);
    int  deleteAllOf(String recvTypeCd, String recvId);
}
