package com.shopjoy.ecBeBo.bo.common.config;

import com.shopjoy.ecBeBo.base.ec.mb.data.dto.MbMemberDto;
import com.shopjoy.ecBeBo.base.ec.mb.data.dto.MbMemberGradeDto;
import com.shopjoy.ecBeBo.base.ec.mb.data.dto.MbMemberGroupDto;
import com.shopjoy.ecBeBo.base.ec.mb.data.entity.MbMember;
import com.shopjoy.ecBeBo.base.ec.mb.data.entity.MbMemberGrade;
import com.shopjoy.ecBeBo.base.ec.mb.data.entity.MbMemberGroup;
import com.shopjoy.ecBeBo.base.ec.mb.repository.MbMemberGradeRepository;
import com.shopjoy.ecBeBo.base.ec.mb.repository.MbMemberGroupRepository;
import com.shopjoy.ecBeBo.base.ec.mb.repository.MbMemberRepository;
import com.shopjoy.ecBeBo.bo.ec.mb.service.BoMbMemGradeService;
import com.shopjoy.ecBeBo.bo.ec.mb.service.BoMbMemGroupService;
import com.shopjoy.ecBeBo.bo.ec.mb.service.BoMbMemberService;
import com.shopjoy.ecBeBo.common.excel.ExcelDomainHandler;
import com.shopjoy.ecBeBo.common.excel.PagedExcelHandler;
import jakarta.persistence.EntityManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Excel download domain registry - member management (mb) master data only.
 *
 * ExcelDomainConfig is dedicated to mb and sy history logs (mbh_x, syh_x tables), so
 * member master data (member, grade, group) is registered separately here to avoid
 * merge conflicts. Registration style and scheduler wiring are identical to the other files.
 *
 * Each domain reuses the same Bo-Domain-Service getList/getPageData method that the
 * screen's own list endpoint already calls, so search filters and sorting always match
 * the on-screen grid - no new SQL/JPQL is written.
 */
@Configuration
public class MbExcelDomainConfig {

    @Bean
    public ExcelDomainHandler<MbMember, MbMemberDto.Item, MbMemberDto.Request>
    mbMemberExcelHandler(BoMbMemberService svc, MbMemberRepository r, EntityManager em) {
        return PagedExcelHandler.of("mbMember", "회원",
            MbMember.class, MbMemberDto.Item.class, MbMemberDto.Request.class,
            r, svc::getList, svc::getPageData, "memberId", em);
    }

    @Bean
    public ExcelDomainHandler<MbMemberGrade, MbMemberGradeDto.Item, MbMemberGradeDto.Request>
    mbMemGradeExcelHandler(BoMbMemGradeService svc, MbMemberGradeRepository r, EntityManager em) {
        return PagedExcelHandler.of("mbMemGrade", "회원등급",
            MbMemberGrade.class, MbMemberGradeDto.Item.class, MbMemberGradeDto.Request.class,
            r, svc::getList, svc::getPageData, "memberGradeId", em);
    }

    @Bean
    public ExcelDomainHandler<MbMemberGroup, MbMemberGroupDto.Item, MbMemberGroupDto.Request>
    mbMemGroupExcelHandler(BoMbMemGroupService svc, MbMemberGroupRepository r, EntityManager em) {
        return PagedExcelHandler.of("mbMemGroup", "회원그룹",
            MbMemberGroup.class, MbMemberGroupDto.Item.class, MbMemberGroupDto.Request.class,
            r, svc::getList, svc::getPageData, "memberGroupId", em);
    }
}
