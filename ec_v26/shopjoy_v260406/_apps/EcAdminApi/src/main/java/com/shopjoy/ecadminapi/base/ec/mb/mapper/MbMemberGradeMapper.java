package com.shopjoy.ecadminapi.base.ec.mb.mapper;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbMemberGradeDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMemberGrade;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface MbMemberGradeMapper {

    MbMemberGradeDto.Item selectById(@Param("id") String id);

    List<MbMemberGradeDto.Item> selectList(MbMemberGradeDto.Request req);

    List<MbMemberGradeDto.Item> selectPageList(MbMemberGradeDto.Request req);

    long selectPageCount(MbMemberGradeDto.Request req);

    int updateSelective(MbMemberGrade entity);
}
