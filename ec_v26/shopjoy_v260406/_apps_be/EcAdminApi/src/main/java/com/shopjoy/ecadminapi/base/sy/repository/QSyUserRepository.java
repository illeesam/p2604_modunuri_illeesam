package com.shopjoy.ecadminapi.base.sy.repository;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyUserDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyUser;

import java.util.List;
import java.util.Optional;

/** SyUser QueryDSL Custom Repository */
public interface QSyUserRepository {

    /** 단건 조회 */
    Optional<SyUserDto.Item> selectById(String userId);

    /** 전체 목록 (page/size 가 양수면 페이징 적용) */
    List<SyUserDto.Item> selectList(SyUserDto.Request search);

    /** 페이지 목록 (pageNo/pageSize 미지정 시 1페이지/10건 기본) */
    SyUserDto.PageResponse selectPageList(SyUserDto.Request search);

    int updateSelective(SyUser entity);
}