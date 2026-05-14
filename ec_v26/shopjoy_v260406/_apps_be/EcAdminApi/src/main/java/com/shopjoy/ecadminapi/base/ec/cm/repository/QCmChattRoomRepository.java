package com.shopjoy.ecadminapi.base.ec.cm.repository;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmChattRoomDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmChattRoom;

import java.util.List;
import java.util.Optional;

/** CmChattRoom QueryDSL Custom Repository */
public interface QCmChattRoomRepository {

    /** 단건 조회 */
    Optional<CmChattRoomDto.Item> selectById(String chattRoomId);

    /** 전체 목록 (page/size 가 양수면 페이징 적용) */
    List<CmChattRoomDto.Item> selectList(CmChattRoomDto.Request search);

    /** 페이지 목록 (pageNo/pageSize 미지정 시 1페이지/10건 기본) */
    CmChattRoomDto.PageResponse selectPageList(CmChattRoomDto.Request search);

    int updateSelective(CmChattRoom entity);
}
